// AI integration with OpenAI API - generate structured challenge JSON
const OpenAI = require('openai');
const { z } = require('zod');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Minimal zod schema for AI output validation
const challengeOutputSchema = z.object({
  title: z.string().min(5),
  description: z.string().min(10),
  instructions: z.string().optional(),
  category: z.string().optional(),
  difficulty_level: z.enum(['easy', 'medium', 'hard']).optional(),
  points_reward: z.number().int().optional(),
  estimated_time_minutes: z.number().int().optional(),
  prerequisites: z.array(z.string()).optional(),
  max_attempts: z.number().int().optional(),
  requires_peer_review: z.boolean().optional(),
  tags: z.array(z.string()).optional(),
  learning_objectives: z.array(z.string()).optional(),
});

function extractJson(text) {
  if (!text) return null;
  // Try to find a JSON code block first
  const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  let candidate = codeBlockMatch ? codeBlockMatch[1].trim() : text.trim();

  // If the candidate contains other text, try to extract the first {...} block
  const firstBrace = candidate.indexOf('{');
  const lastBrace = candidate.lastIndexOf('}');
  if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
    candidate = candidate.slice(firstBrace, lastBrace + 1);
  }

  try {
    return JSON.parse(candidate);
  } catch (err) {
    return null;
  }
}

const aiService = {
  /**
   * Generate a challenge based on a Goal object.
   * goal: { title, description, category, difficulty_level, learning_objectives }
   * options: { temperature, maxTokens, overrides }
   */
  generateChallenge: async (goal, options = {}) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured on the server. AI generation is unavailable.');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const temperature = options.temperature ?? 0.2;

    // System instructions: be explicit about DB schema constraints and JSON-only output.
    const systemMsg = `You are an assistant that MUST output ONLY valid JSON (no markdown, no surrounding commentary) describing a single learning challenge.

  The JSON must include these fields with the following types and constraints:
  - title: string, max 100 characters
  - description: string, max 2000 characters
  - instructions: string, max 2000 characters (optional; can repeat description)
  - category: string, max 50 characters
  - difficulty_level: one of the strings "easy", "medium", "hard"
  - points_reward: integer between 0 and 500
  - estimated_time_minutes: integer between 5 and 1440
  - prerequisites: array of strings (each max 150 chars)
  - max_attempts: integer between 1 and 10
  - requires_peer_review: boolean
  - tags: array of short strings (max 10 tags, each max 40 chars)
  - learning_objectives: array of strings (1-8 items, each max 200 chars)

  All arrays must be valid JSON arrays. Do NOT include extra fields beyond the schema above. If a value is unknown, choose a reasonable default according to the requested difficulty. ALWAYS return a single JSON object that validates against these rules. Example (format exactly like this):
  {
    "title": "Short Title",
    "description": "Describe the challenge in 1-3 paragraphs.",
    "instructions": "Optional: step-by-step instructions.",
    "category": "algorithms",
    "difficulty_level": "medium",
    "points_reward": 25,
    "estimated_time_minutes": 60,
    "prerequisites": ["Arrays", "Loops"],
    "max_attempts": 3,
    "requires_peer_review": false,
    "tags": ["arrays","sorting"],
    "learning_objectives": ["Implement merge sort", "Analyze time complexity"]
  }
  `;

    // allow caller to suggest a difficulty via options.difficulty
    let difficulty = String(options.difficulty || goal.difficulty_level || 'medium').toLowerCase();
    if (!['easy', 'medium', 'hard'].includes(difficulty)) {
      difficulty = 'medium';
    }

    // User prompt: provide context, requested difficulty, and guidance for reasonable values
    const userMsg = `Create a challenge for the following goal. Use the requested difficulty and ensure all values are appropriate for that difficulty level. Do NOT add any text outside the JSON object.
Goal Title: ${goal.title}
Goal Description: ${goal.description || ''}
Goal Category: ${goal.category || ''}
Requested Difficulty: ${difficulty}
Learning Objectives: ${(goal.learning_objectives || []).join(', ')}

Guidance:
- For "easy": choose points between 5-25, estimated_time_minutes 5-60, max_attempts 3-5.
- For "medium": choose points between 20-75, estimated_time_minutes 30-180, max_attempts 2-4.
- For "hard": choose points between 50-500, estimated_time_minutes 120-1440, max_attempts 1-3.

Return ONLY a single JSON object matching the schema exactly. Use realistic, concise text. Arrays must be plain JSON arrays. Do not include diagnostics, explanations, or surrounding code blocks.`;

    const promptMessages = [
      { role: 'system', content: systemMsg },
      { role: 'user', content: userMsg },
    ];

    let aiText;
    try {
      const resp = await client.chat.completions.create({
        model,
        messages: promptMessages,
        temperature,
        max_tokens: options.maxTokens || 800,
      });

      aiText = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
    } catch (err) {
      throw new Error(`AI request failed: ${err.message}`);
    }

    const parsed = extractJson(aiText);
    if (!parsed) {
      throw new Error('Failed to parse JSON from AI response');
    }

    const result = challengeOutputSchema.safeParse(parsed);
    if (!result.success) {
      // return detailed errors for debugging
      throw new Error(`AI response did not match expected schema: ${JSON.stringify(result.error.errors)}`);
    }

    // Apply sensible defaults where missing
    const out = result.data;
    return {
      title: out.title,
      description: out.description,
      instructions: out.instructions || out.description || 'Complete the task as described.',
      category: out.category || goal.category || 'general',
      // prefer AI's difficulty if provided, otherwise use the requested difficulty
      difficulty_level: out.difficulty_level || difficulty,
      points_reward: typeof out.points_reward === 'number' ? out.points_reward : 10,
      estimated_time_minutes: typeof out.estimated_time_minutes === 'number' ? out.estimated_time_minutes : 15,
      prerequisites: out.prerequisites || [],
      max_attempts: typeof out.max_attempts === 'number' ? out.max_attempts : 3,
      requires_peer_review: typeof out.requires_peer_review === 'boolean' ? out.requires_peer_review : false,
      tags: out.tags || [],
      learning_objectives: out.learning_objectives || goal.learning_objectives || [],
      ai_generated: true,
    };
  },

  // Evaluate a submission and return structured feedback
  evaluateSubmission: async (submissionText, options = {}) => {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured on the server. AI evaluation is unavailable.');
    }

    const model = process.env.OPENAI_MODEL || 'gpt-3.5-turbo';
    const temperature = options.temperature ?? 0.0;

    const systemMsg = `You are an expert instructor and code reviewer. You MUST output ONLY valid JSON (no markdown, no commentary) describing a detailed evaluation of the submission.

  Return a single JSON object with these fields (types and constraints):
  - feedback: string (a rich, multi-paragraph summary of the submission's overall quality, strengths, and key issues; prefer 200-1200 characters)
  - score: integer between 0 and 100
  - rating_1_to_5: integer between 1 and 5 representing the AI's assessment on the same 1-5 scale used by peer reviewers
  - suggestions: array of short actionable suggestions (strings). Provide 3-7 items where appropriate.
  - strengths: array of concise strengths (strings). Provide 1-6 items.
  - improvements: array of concise improvement items (strings). Provide 1-6 items.
  - detailed_analysis: array of objects (each with 'area' and 'comment') giving fine-grained comments (e.g., 'logic', 'style', 'edge-cases', 'performance'). Optional but recommended.
  - recommended_resources: array of objects with { "title": string, "url": string } for 0-5 helpful links.
  - confidence_score: decimal between 0 and 1 indicating your confidence in this evaluation.

  Constraints:
  - All arrays and objects must be valid JSON types.
  - Strings should be concise and relevant; avoid filler.
  - If the submission is empty or not code, produce a low score and constructive next steps.
  - Do NOT include any fields outside the schema above.
  `;

    const userMsg = `Evaluate the following submission thoroughly. Provide clear, actionable, and balanced feedback. Use the schema exactly as described in the system prompt. IMPORTANT: peer review scores use a 1-5 integer scale; include a field named 'rating_1_to_5' (integer 1-5) in your JSON output in addition to any 0-100 score.\n\nSubmission:\n${submissionText || ''}\n\nProvide the JSON object only.`;

    let aiText;
    try {
      const resp = await client.chat.completions.create({
        model,
        messages: [
          { role: 'system', content: systemMsg },
          { role: 'user', content: userMsg },
        ],
        temperature,
        max_tokens: options.maxTokens || 500,
      });

      aiText = resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content;
    } catch (err) {
      throw new Error(`AI evaluation request failed: ${err.message}`);
    }

    const parsed = extractJson(aiText);
    if (!parsed) {
      throw new Error('Failed to parse JSON from AI evaluation response');
    }

    // Zod schema for a richer evaluation output
    const analysisItem = z.object({ area: z.string(), comment: z.string() });
    const resourceItem = z.object({ title: z.string(), url: z.string().url().optional() });

    const evalSchema = z.object({
      feedback: z.string().min(1).optional(),
      score: z.number().int().min(0).max(100).optional(),
      rating_1_to_5: z.number().int().min(1).max(5).optional(),
      suggestions: z.array(z.string()).optional(),
      strengths: z.array(z.string()).optional(),
      improvements: z.array(z.string()).optional(),
      detailed_analysis: z.array(analysisItem).optional(),
      recommended_resources: z.array(resourceItem).optional(),
      confidence_score: z.number().min(0).max(1).optional(),
    });

    const validation = evalSchema.safeParse(parsed);
    if (!validation.success) {
      // Attempt to coerce best-effort fields if structure differs
      const fallback = {
        feedback: parsed.feedback || parsed.summary || 'Auto-graded: partial results',
        score: Number.isInteger(parsed.score) ? parsed.score : Math.max(0, Math.min(100, Math.floor((parsed.confidence_score || 0.5) * 100))),
        suggestions: parsed.suggestions || parsed.recommendations || [],
        strengths: parsed.strengths || [],
        improvements: parsed.improvements || [],
        detailed_analysis: parsed.detailed_analysis || [],
        recommended_resources: parsed.recommended_resources || [],
        confidence_score: typeof parsed.confidence_score === 'number' ? parsed.confidence_score : 0.5,
      };
      return fallback;
    }

    const out = validation.data;
    return {
      feedback: out.feedback || '',
      score: typeof out.score === 'number' ? out.score : 0,
      rating_1_to_5: typeof out.rating_1_to_5 === 'number' ? out.rating_1_to_5 : undefined,
      suggestions: out.suggestions || [],
      strengths: out.strengths || [],
      improvements: out.improvements || [],
      detailed_analysis: out.detailed_analysis || [],
      recommended_resources: out.recommended_resources || [],
      confidence_score: typeof out.confidence_score === 'number' ? out.confidence_score : 0,
    };
  },

  // keep placeholders for other AI functions (not implemented yet)
  generateFeedback: async () => {
    throw new Error('Not implemented');
  },
  generateHints: async () => {
    throw new Error('Not implemented');
  },
  analyzePattern: async () => {
    throw new Error('Not implemented');
  },
  suggestNextChallenges: async () => {
    throw new Error('Not implemented');
  },
};

module.exports = aiService;
