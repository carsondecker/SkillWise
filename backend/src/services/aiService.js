// services/aiService.js

const OpenAI = require('openai');

const client = () => {
  if (!process.env.OPENAI_API_KEY) {
    // When running tests or if AI disabled
    return null;
  }

  return new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
};

const { aiGeneratedChallengeSchema } = require('../middleware/validation').schemas;

// Utility to parse OpenAI responses safely
function safeJSON (text) {
  try {
    return JSON.parse(text);
  } catch (err) {
    console.error('❌ Failed to parse AI JSON:', text);
    throw new Error('AI returned invalid JSON format');
  }
}
const generateOneChallengeAgentic = async (goal, userId, difficulty) => {
  let attempts = 0;

  while (attempts < 4) {
    attempts++;

    const prompt = buildAIChallengePrompt(goal, difficulty);

    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL,
      messages: [
        {
          role: 'system',
          content:
            'You are SkillWise AI. You ONLY output clean, structured JSON challenges. No explanations.',
        },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    });

    const rawText = extractAIMessage(response);
    const json = safeJSON(rawText);

    const parsed = aiGeneratedChallengeSchema.safeParse(json);

    if (parsed.success) {
      const clean = parsed.data;

      return {
        ...clean,
        goal_id: goal.id,
        created_by: userId,
        ai_generated: true,
        difficulty_level: difficulty,
      };
    }

    console.warn(`⚠️ Invalid AI challenge format, retrying... (attempt ${attempts})`);
  }

  throw new Error('AI failed to generate a valid challenge after several attempts');
};
const buildAIChallengePrompt = (goal, difficulty) => `
You are generating a SkillWise learning challenge.

Goal:
- Title: ${goal.title}
- Description: ${goal.description}
- Category: ${goal.category}

You MUST return ONE challenge with STRICT JSON format:

{
  "title": "",
  "description": "",
  "instructions": "",
  "category": "${goal.category}",
  "difficulty_level": "${difficulty}",
  "points_reward": 0,
  "estimated_time_minutes": 30,
  "max_attempts": 3,
  "requires_peer_review": false,
  "is_active": true,
  "tags": [],
  "prerequisites": [],
  "learning_objectives": []
}

Rules:
1. "instructions" MUST be a clear step-by-step list telling the user EXACTLY what to submit.
2. Title must be concise and reflect the challenge.
3. Difficulty_level MUST be "${difficulty}".
4. Return ONLY raw JSON. No commentary.
5. JSON must be valid — no trailing commas, no backticks, no text outside the object.
6. This challenge must NOT repeat previous ones and must represent a unique learning task.
7. Estimated time must reflect difficulty:
   - easy: 30–60 minutes
   - medium: 60–120 minutes
   - hard: 120–180 minutes
8. Points should scale with difficulty:
   - easy: 10–30
   - medium: 30–60
   - hard: 60–100
9. Learning objectives must be real, measurable outcomes.
`;
function extractAIMessage (res) {
  if (!res.choices || res.choices.length === 0) {
    throw new Error('AI returned empty response.');
  }

  // Chat completion format
  if (res.choices[0].message && res.choices[0].message.content) {
    return res.choices[0].message.content;
  }

  // Text completion (fallback)
  if (res.choices[0].text) {
    return res.choices[0].text;
  }

  throw new Error('AI response has no usable text content.');
}

module.exports = {
  /* ============================================================
     🤖 1. Generate Challenge From Goal
     Called by controller: aiService.generateChallengeFromGoal(goal, userId)
  ============================================================ */
  // services/aiService.js
  generateChallengesForGoal: async (goal, userId, count) => {
    const results = [];

    // Enforce different difficulty levels
    let difficultyPool = ['easy', 'medium', 'hard'].slice(0, count);

    for (let i = 0; i < count; i++) {
      const difficulty = difficultyPool[i];
      const challenge = await generateOneChallengeAgentic(goal, userId, difficulty);
      results.push(challenge);
    }

    return results;
  },

  /* ============================================================
     📝 2. AI Feedback
  ============================================================ */
  generateFeedback: async (submissionText, challengeId, userId) => {
    const prompt = `
Provide feedback for the following user submission:

Challenge ID: ${challengeId}
User ID: ${userId}

Submission:
${submissionText}

Return ONLY JSON:
{
  "score": 0-100,
  "strengths": [],
  "improvements": [],
  "summary": ""
}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You grade user submissions.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.4,
    });

    return safeJSON(response.choices[0].message.content);
  },

  /* ============================================================
     💡 3. Challenge Hints (AI generated)
  ============================================================ */
  generateHints: async (challenge) => {
    const prompt = `
Generate 3 helpful hints for the following challenge:

Title: ${challenge.title}
Description: ${challenge.description}

Return ONLY JSON array:
[
  "hint1",
  "hint2",
  "hint3"
]
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You provide hints without giving the answer.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    });

    return safeJSON(response.choices[0].message.content);
  },

  /* ============================================================
     🧠 4. Suggest Challenges Based on User Progress
  ============================================================ */
  suggestChallenges: async (progressData) => {
    const prompt = `
Based on the user's progress, recommend 3 challenges they should take next.

Progress Data:
${JSON.stringify(progressData, null, 2)}

Return ONLY JSON:
[
  { "title": "", "category": "", "reason": "" }
]
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You analyze user progress and recommend challenges.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.7,
    });

    return safeJSON(response.choices[0].message.content);
  },

  /* ============================================================
     📊 5. Analyze Progress
  ============================================================ */
  analyzeProgress: async (progressData) => {
    const prompt = `
Analyze the user's learning progress.

Progress Data:
${JSON.stringify(progressData, null, 2)}

Return ONLY JSON:
{
  "summary": "",
  "strengths": [],
  "weaknesses": [],
  "recommendations": []
}
`;

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an analytics engine summarizing learning behavior.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    });

    return safeJSON(response.choices[0].message.content);
  },
};
