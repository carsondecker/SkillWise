/**
 * API Routes Index - Mounts all API endpoints under /api/*
 *
 * Route Structure:
 * - /api/auth/*         - Authentication endpoints (login, register, logout, refresh)
 * - /api/users/*        - User management (profile, settings, statistics)
 * - /api/goals/*        - Learning goals CRUD operations
 * - /api/challenges/*   - Challenge management and participation
 * - /api/progress/*     - Progress tracking and analytics
 * - /api/submissions/*  - Work submission and evaluation
 * - /api/ai/*           - AI-powered features (feedback, hints, suggestions)
 * - /api/reviews/*      - Peer review system
 * - /api/leaderboard/*  - Rankings and achievements
 * - /api/health         - API health check endpoint
 */

const express = require('express');
const router = express.Router();

// --------------------------------------------------
// Import route modules
// --------------------------------------------------
const authRoutes = require('./auth');
const userRoutes = require('./users');
const goalRoutes = require('./goals');
const challengeRoutes = require('./challenges');
const progressRoutes = require('./progress');
const submissionRoutes = require('./submissions');
const aiRoutes = require('./ai');
const reviewRoutes = require('./reviews');
const leaderboardRoutes = require('./leaderboard');

// --------------------------------------------------
// API Metadata Route (default /api)
// --------------------------------------------------
router.get('/', (req, res) => {
  res.status(200).json({
    name: 'SkillWise API',
    version: process.env.npm_package_version || '1.0.0',
    description: 'AI-powered learning platform API',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      users: '/api/users',
      goals: '/api/goals',
      challenges: '/api/challenges',
      progress: '/api/progress',
      submissions: '/api/submissions',
      ai: '/api/ai',
      reviews: '/api/peer-review',
      leaderboard: '/api/leaderboard',
      health: '/api/health',
    },
    timestamp: new Date().toISOString(),
  });
});

// --------------------------------------------------
// Mount Route Modules
// --------------------------------------------------
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/goals', goalRoutes);
router.use('/challenges', challengeRoutes);
router.use('/progress', progressRoutes);
router.use('/submissions', submissionRoutes);
router.use('/ai', aiRoutes);
router.use('/peer-review', reviewRoutes);
router.use('/leaderboard', leaderboardRoutes);

// --------------------------------------------------
// Health Check Endpoint
// --------------------------------------------------
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'healthy',
    service: 'SkillWise API',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    version: process.env.npm_package_version || '1.0.0',
    routes: {
      total: router.stack.length,
      mounted: [
        'auth', 'users', 'goals', 'challenges',
        'progress', 'submissions', 'ai', 'reviews', 'leaderboard',
      ],
    },
  });
});

module.exports = router;
