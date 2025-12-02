// controllers/aiController.js

const aiService = require('../services/aiService');
const Goal = require('../models/Goal');
const Challenge = require('../models/Challenge');
const Progress = require('../models/Progress');

const aiController = {
  /* ============================================================
     🤖 1. Generate a Challenge for a Goal
     Route: POST /ai/generate-challenge/:goalId
  ============================================================ */
  generateChallengeForGoal: async (req, res, next) => {
    try {
      const { goalId } = req.params;
      const userId = req.user.id;
      const count = Math.min(req.body.count || 1, 3);
      const rawDifficulty = req.body.difficulty;
      const requiresPeerReview = req.body.requires_peer_review === true;
      const allowedDifficulties = ['easy', 'medium', 'hard'];
      const difficulty = allowedDifficulties.includes(rawDifficulty)
        ? rawDifficulty
        : null;

      // 1️⃣ Fetch goal
      const goal = await Goal.findById(goalId);
      if (!goal) {
        return res.status(404).json({ error: 'Goal not found' });
      }

      // 2️⃣ Generate N challenges (agentic loop handled in service)
      const generatedChallenges = await aiService.generateChallengesForGoal(
        goal,
        userId,
        {
          count,
          difficulty,
          requiresPeerReview,
        },
      );

      // 3️⃣ Save all to DB
      const saved = [];
      for (const ch of generatedChallenges) {
        const savedChallenge = await Challenge.create(ch);
        saved.push(savedChallenge);
      }

      return res.status(200).json({
        message: `AI generated ${saved.length} challenge(s) successfully.`,
        challenges: saved,
      });

    } catch (err) {
      console.error('❌ AI Challenge Generation Error:', err);
      return res.status(500).json({
        error: 'Failed to generate challenge',
        details: err.message,
      });
    }
  },

  /* ============================================================
     📝 2. AI Feedback on Submissions
     Route: POST /ai/feedback
  ============================================================ */
  generateFeedback: async (req, res, next) => {
    try {
      const { submissionText, challengeId } = req.body;
      const userId = req.user.id;

      if (!submissionText) {
        return res.status(400).json({ error: 'submissionText is required' });
      }

      const feedback = await aiService.generateFeedback(submissionText, challengeId, userId);

      return res.status(200).json({ feedback });
    } catch (err) {
      console.error('❌ AI Feedback Error:', err);
      return res.status(500).json({
        error: 'Failed to generate AI feedback',
        details: err.message,
      });
    }
  },

  /* ============================================================
     💡 3. Get AI-powered Hints for a Challenge
     Route: GET /ai/hints/:challengeId
  ============================================================ */
  getHints: async (req, res, next) => {
    try {
      const { challengeId } = req.params;

      const challenge = await Challenge.findById(challengeId);
      if (!challenge) {
        return res.status(404).json({ error: 'Challenge not found' });
      }

      const hints = await aiService.generateHints(challenge);

      return res.status(200).json({ hints });
    } catch (err) {
      console.error('❌ AI Hint Generation Error:', err);
      return res.status(500).json({
        error: 'Failed to generate hints',
        details: err.message,
      });
    }
  },

  /* ============================================================
     🧠 4. Suggest Challenges for User (Based on Completion, Category, Difficulty)
     Route: GET /ai/suggestions
  ============================================================ */
  suggestChallenges: async (req, res, next) => {
    try {
      const userId = req.user.id;

      // Get user's activity to intelligently recommend next challenges
      const userProgress = await Progress.getUserProgress(userId);

      const recommendations = await aiService.suggestChallenges(userProgress);

      return res.status(200).json({ suggestions: recommendations });
    } catch (err) {
      console.error('❌ AI Suggestions Error:', err);
      return res.status(500).json({
        error: 'Failed to generate challenge suggestions',
        details: err.message,
      });
    }
  },

  /* ============================================================
     📊 5. Analyze Progress (AI summary)
     Route: GET /ai/analysis
  ============================================================ */
  analyzeProgress: async (req, res, next) => {
    try {
      const userId = req.user.id;

      const progressData = await Progress.getUserProgress(userId);

      const analysis = await aiService.analyzeProgress(progressData);

      return res.status(200).json({ analysis });
    } catch (err) {
      console.error('❌ AI Progress Analysis Error:', err);
      return res.status(500).json({
        error: 'Failed to analyze progress',
        details: err.message,
      });
    }
  },

  /* ============================================================
     🧾 6. Grade a completed or peer-reviewed challenge
     Route: POST /ai/grade/challenge/:challengeId
  ============================================================ */
  gradeChallenge: async (req, res) => {
    try {
      const userId = req.user.id;
      const challengeId = parseInt(req.params.challengeId, 10);
      const force = req.body?.force === true || req.query?.force === 'true';

      const grade = await aiService.gradeChallengeSubmission({
        userId,
        challengeId,
        force,
      });

      return res.status(200).json({ grade });
    } catch (err) {
      console.error('❌ AI Grading Error:', err);
      const status = err.statusCode || 500;
      return res.status(status).json({
        error: err.message || 'Failed to grade challenge',
        code: err.code || err.name,
      });
    }
  },

  /* ============================================================
     💬 7. Chat with Memori-backed memory service
     Route: POST /ai/chat
  ============================================================ */
  chatWithMemory: async (req, res) => {
    try {
      const userId = req.user?.id;
      const { message } = req.body;

      if (!message || !message.trim()) {
        return res.status(400).json({ error: 'Message is required' });
      }

      const result = await aiService.chatWithMemory({ userId, message });

      return res.status(200).json(result);
    } catch (err) {
      console.error('❌ AI Chat Error:', err.message);
      const status = err.statusCode || 500;
      return res.status(status).json({
        error: err.message || 'Failed to process chat message',
        code: err.code || err.name,
      });
    }
  },
};

module.exports = aiController;
