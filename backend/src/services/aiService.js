// services/aiService.js

const OpenAI = require('openai');
const db = require('../database/connection');
const { AppError } = require('../middleware/errorHandler');

const { aiGeneratedChallengeSchema } = require('../middleware/validation').schemas;

const createClient = () => {
  if (!process.env.OPENAI_API_KEY) return null;
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
};

const getClient = () => {
  const instance = createClient();
  if (!instance) {
    throw new AppError(
      'AI client not configured. Set OPENAI_API_KEY to enable grading.',
      503,
      'AI_UNAVAILABLE',
    );
  }
  return instance;
};

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
  const maxAttempts = 4; // initial try + 3 retries

  while (attempts < maxAttempts) {
    attempts++;

    try {
      const prompt = buildAIChallengePrompt(goal, difficulty);

      const aiClient = getClient();
      const response = await aiClient.chat.completions.create({
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

      console.warn(
        `⚠️ Invalid AI challenge format (validation failed), retrying... (attempt ${attempts})`,
      );
    } catch (err) {
      console.warn(
        `⚠️ AI challenge parse error, retrying... (attempt ${attempts}): ${err.message}`,
      );
      if (attempts >= maxAttempts) {
        throw new Error('AI failed to generate a valid challenge after several attempts');
      }
    }
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

const buildGradePrompt = ({
  challenge,
  submission,
  peerReviews,
}) => {
  const peerReviewText =
    peerReviews.length === 0
      ? 'No peer reviews.'
      : peerReviews
        .map(
          (rev, idx) =>
            `Review ${idx + 1} — Rating: ${rev.rating || 'n/a'} / 5, Time: ${
              rev.time_spent_minutes || 'n/a'
            } minutes, Notes: ${rev.review_text || 'n/a'}, Criteria: ${
              rev.criteria_scores ? JSON.stringify(rev.criteria_scores) : 'n/a'
            }`,
        )
        .join('\n');

  return `
You are grading a coding challenge submission. Provide a concise grade and feedback.

Challenge:
- Title: ${challenge.title}
- Description: ${challenge.description}
- Instructions: ${challenge.instructions}
- Difficulty: ${challenge.difficulty_level}
- Category: ${challenge.category}
- Points Reward: ${challenge.points_reward}

Submission (latest):
${submission.submission_text}

Peer Reviews:
${peerReviewText}

Return ONLY valid JSON:
{
  "score": 0-100,
  "summary": "one-paragraph summary",
  "strengths": ["bullet", "..."],
  "improvements": ["bullet", "..."],
  "suggestions": ["bullet", "..."],
  "confidence": 0-1
}
`;
};

module.exports = {
  /* ============================================================
     🤖 1. Generate Challenge From Goal
     Called by controller: aiService.generateChallengeFromGoal(goal, userId)
  ============================================================ */
  // services/aiService.js
  generateChallengesForGoal: async (
    goal,
    userId,
    { count = 1, difficulty = null, requiresPeerReview = false } = {},
  ) => {
    const results = [];

    const allowedDifficulties = ['easy', 'medium', 'hard'];
    const normalizedDifficulty = allowedDifficulties.includes(difficulty)
      ? difficulty
      : null;

    // Enforce difficulty selection; if none chosen, keep varied defaults
    let difficultyPool = normalizedDifficulty
      ? Array.from({ length: count }, () => normalizedDifficulty)
      : ['easy', 'medium', 'hard'].slice(0, count);

    for (let i = 0; i < count; i++) {
      const level = difficultyPool[i] || 'medium';
      const challenge = await generateOneChallengeAgentic(goal, userId, level);
      const withPeerReview =
        level === 'hard' && requiresPeerReview
          ? { ...challenge, requires_peer_review: true }
          : challenge;
      results.push(withPeerReview);
    }

    return results;
  },

  /* ============================================================
     📝 2. AI Feedback
  ============================================================ */
  generateFeedback: async (submissionText, challengeId, userId) => {
    const aiClient = getClient();
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

    const response = await aiClient.chat.completions.create({
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
    const aiClient = getClient();
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

    const response = await aiClient.chat.completions.create({
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
    const aiClient = getClient();
    const prompt = `
Based on the user's progress, recommend 3 challenges they should take next.

Progress Data:
${JSON.stringify(progressData, null, 2)}

Return ONLY JSON:
[
  { "title": "", "category": "", "reason": "" }
]
`;

    const response = await aiClient.chat.completions.create({
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
    const aiClient = getClient();
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

    const response = await aiClient.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are an analytics engine summarizing learning behavior.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.6,
    });

    return safeJSON(response.choices[0].message.content);
  },

  /* ============================================================
     🧾 6. Grade a completed or peer-reviewed challenge submission
  ============================================================ */
  gradeChallengeSubmission: async ({ userId, challengeId, force = false }) => {
    if (!challengeId) {
      throw new AppError('Challenge ID is required', 400, 'INVALID_INPUT');
    }

    const { rows: challengeRows } = await db.query(
      `
      SELECT *
      FROM challenges
      WHERE id = $1
      LIMIT 1
      `,
      [challengeId],
    );

    const challenge = challengeRows[0];
    if (!challenge) throw new AppError('Challenge not found', 404, 'NOT_FOUND');

    if (!['in_progress', 'peer_reviewed'].includes(challenge.status)) {
      throw new AppError(
        'Challenge must be in_progress or peer-reviewed before AI grading.',
        400,
        'CHALLENGE_NOT_READY',
      );
    }

    const { rows: submissionRows } = await db.query(
      `
      SELECT *
      FROM submissions
      WHERE user_id = $1
        AND challenge_id = $2
      ORDER BY submitted_at DESC
      LIMIT 1
      `,
      [userId, challengeId],
    );

    const submission = submissionRows[0];
    if (!submission) {
      throw new AppError('No submission found to grade', 404, 'NO_SUBMISSION');
    }

    // Reuse latest AI grade unless forced
    const { rows: existingFeedback } = await db.query(
      `
      SELECT *
      FROM ai_feedback
      WHERE submission_id = $1
        AND feedback_type = 'grading'
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [submission.id],
    );

    if (existingFeedback.length && !force) {
      const existing = existingFeedback[0];
      return {
        submissionId: submission.id,
        score: submission.score ?? null,
        summary: submission.feedback || existing.feedback_text,
        strengths: existing.strengths || [],
        improvements: existing.improvements || [],
        suggestions: existing.suggestions || [],
        feedbackId: existing.id,
        existing: true,
      };
    }

    const { rows: peerReviews } = await db.query(
      `
      SELECT review_text, rating, criteria_scores, time_spent_minutes
      FROM peer_reviews
      WHERE submission_id = $1
      `,
      [submission.id],
    );

    const prompt = buildGradePrompt({
      challenge,
      submission,
      peerReviews,
    });

    const aiClient = getClient();
    const started = Date.now();
    const response = await aiClient.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You are a concise, strict grader. Respond ONLY with JSON.' },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
    });
    const elapsed = Date.now() - started;

    const parsed = safeJSON(extractAIMessage(response));
    const score = Number(parsed.score ?? 0);
    const summary = parsed.summary || 'AI feedback';
    const strengths = Array.isArray(parsed.strengths) ? parsed.strengths : [];
    const improvements = Array.isArray(parsed.improvements) ? parsed.improvements : [];
    const suggestions = Array.isArray(parsed.suggestions) ? parsed.suggestions : [];
    const confidenceScore = parsed.confidence != null ? Math.min(Math.max(Number(parsed.confidence), 0), 1) : null;

    const { rows: feedbackRows } = await db.query(
      `
      INSERT INTO ai_feedback (
        submission_id,
        feedback_text,
        feedback_type,
        confidence_score,
        suggestions,
        strengths,
        improvements,
        ai_model,
        processing_time_ms,
        created_at,
        updated_at
      )
      VALUES ($1, $2, 'grading', $3, $4, $5, $6, $7, $8, NOW(), NOW())
      RETURNING *
      `,
      [
        submission.id,
        summary,
        confidenceScore,
        suggestions,
        strengths,
        improvements,
        process.env.OPENAI_MODEL || 'gpt-4o-mini',
        elapsed,
      ],
    );

    await db.query(
      `
      UPDATE submissions
      SET score = $2,
          feedback = $3,
          status = 'graded',
          graded_at = NOW(),
          updated_at = NOW()
      WHERE id = $1
      `,
      [submission.id, score, summary],
    );

    const feedback = feedbackRows[0];
    return {
      submissionId: submission.id,
      score,
      summary,
      strengths,
      improvements,
      suggestions,
      feedbackId: feedback.id,
      existing: false,
    };
  },
};
