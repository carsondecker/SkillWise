// TODO: Implement AI integration with OpenAI API
const OpenAI = require('openai');

const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const aiService = {
  // Generate feedback using AI. Accepts either (payloadObject) or (submissionText, challengeContext)
  generateFeedback: async (payloadOrText, maybeContext) => {
    try {
      const payload = (typeof payloadOrText === 'object' && payloadOrText !== null)
        ? payloadOrText
        : { submission: payloadOrText, challengeContext: maybeContext };

      const submissionText = payload.submission || payload.submissionText || '';
      const challengeContext = payload.challengeContext || payload.challengeId || payload.challenge || {};

      if (!submissionText) {
        throw new Error('Missing submission text for feedback generation');
      }

      const system = `You are an expert coding mentor. Provide concise, actionable feedback on a student's submission. Include: a short summary, strengths, weaknesses, specific suggestions, and a simple next-step exercise. If submission contains code, point out likely bugs or improvements. Respond in JSON with keys: summary, strengths, weaknesses, suggestions, nextStep.`;
      const userPrompt = `Submission:\n${submissionText}\n\nContext:\n${JSON.stringify(challengeContext)}`;

      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 700,
        temperature: 0.2
      });

      const text = (resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) || '';
      // Try to parse JSON from model; fall back to raw text
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (e) {
        return { raw: text };
      }
    } catch (err) {
      throw err;
    }
  },

  // Generate hints for a challenge. Accepts (challengeId, options) or single payload.
  generateHints: async (payloadOrId, maybeOptions) => {
    try {
      const payload = (typeof payloadOrId === 'object' && payloadOrId !== null)
        ? payloadOrId
        : { challengeId: payloadOrId, options: maybeOptions };

      const { challengeId, options = {} } = payload;
      const level = options.level || options.difficulty || 'medium';
      const context = options.context || {};

      if (!challengeId) {
        throw new Error('Missing challengeId for hints generation');
      }

      const system = `You are a helpful tutor providing progressive hints for programming challenges. Provide 1-3 hints ordered from high-level to specific. Keep each hint short. Return a JSON array of hint objects: [{level, hint, hintType}].`;
      const userPrompt = `Challenge ID: ${challengeId}\nHint level: ${level}\nContext: ${JSON.stringify(context)}`;

      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 400,
        temperature: 0.3
      });

      const text = (resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) || '';
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (e) {
        // fallback: split into lines as simple hints
        const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
        return lines.map((l, i) => ({ level: i + 1, hint: l }));
      }
    } catch (err) {
      throw err;
    }
  },

  // Analyze learning patterns. Accepts (userId, learningData)
  analyzePattern: async (userIdOrPayload, maybeData) => {
    try {
      const payload = (typeof userIdOrPayload === 'object' && userIdOrPayload !== null && !userIdOrPayload.userId)
        ? userIdOrPayload
        : { userId: userIdOrPayload, learningData: maybeData };

      const { userId, learningData = {} } = payload;
      if (!userId) {
        throw new Error('Missing userId for pattern analysis');
      }

      const system = `You are an educational data analyst. Given a user's learning history, identify strengths, weaknesses, trends, and recommend personalized actions and milestone targets. Return JSON { strengths:[], weaknesses:[], trends:[], recommendations:[] }`;
      const userPrompt = `UserId: ${userId}\nData: ${JSON.stringify(learningData).slice(0, 2000)}`;

      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 700,
        temperature: 0.2
      });

      const text = (resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) || '';
      try {
        const parsed = JSON.parse(text);
        return parsed;
      } catch (e) {
        return { raw: text };
      }
    } catch (err) {
      throw err;
    }
  },

  // Suggest next challenges for a user. Accepts (userId) or payload.
  suggestNextChallenges: async (userIdOrPayload) => {
    try {
      const userId = (typeof userIdOrPayload === 'object' && userIdOrPayload !== null && userIdOrPayload.userId)
        ? userIdOrPayload.userId
        : userIdOrPayload;

      if (!userId) {
        throw new Error('Missing userId for challenge suggestion');
      }

      const system = `You are an intelligent tutor recommending next practice challenges. Based on the user's progress, recommend up to 10 challenges, each with id, title, difficulty, shortDescription, and tags. Respond with valid JSON: { suggestions: [ {id, title, difficulty, shortDescription, tags:[] } ] }`;
      const userPrompt = `UserId: ${userId}\nProvide personalized suggestions.`;

      const resp = await client.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: userPrompt }
        ],
        max_tokens: 800,
        temperature: 0.35
      });

      const text = (resp && resp.choices && resp.choices[0] && resp.choices[0].message && resp.choices[0].message.content) || '';
      try {
        const parsed = JSON.parse(text);
        return parsed.suggestions || parsed;
      } catch (e) {
        // best-effort: return raw text if parsing fails
        return { raw: text };
      }
    } catch (err) {
      throw err;
    }
  },

  // Backwards-compatible aliases used by controllers
  getHints: async (...args) => aiService.generateHints(...args),
  suggestChallenges: async (...args) => aiService.suggestNextChallenges(...args),
  analyzeProgress: async (...args) => aiService.analyzePattern(...args),
  generateHints: async (...args) => aiService.generateHints(...args), // keep original name available
};

module.exports = aiService;