// src/routes/auth.js
const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');

const authController = require('../controllers/authController');
const { loginValidation, registerValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// 🔒 Per-route rate limiter to protect auth endpoints from brute force
// Defaults are intentionally generous for local/dev; tighten via env if needed.
const authLimiter = rateLimit({
  windowMs: Number(process.env.AUTH_RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000), // default 15 minutes
  max: Number(process.env.AUTH_RATE_LIMIT_MAX || 5000), // default generous ceiling to avoid accidental lockouts
  standardHeaders: true,
  legacyHeaders: false,
  message: 'Too many requests, please try again later.',
});

// 🔹 AUTH ROUTES
// --------------------------------------------------

// 🟢 Register new user
router.post('/register', authLimiter, registerValidation, authController.register);

// 🟢 Login existing user
router.post('/login', authLimiter, loginValidation, authController.login);

// 🔵 Logout current session
router.post('/logout', authLimiter, authController.logout);

// 🟡 Refresh access token
router.post('/refresh', authLimiter, authController.refreshToken);

// ⚪️ Optional future expansion: Forgot/Reset Password
// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password', authController.resetPassword);

// 🟣 Authenticated routes (profile)
// router.get('/profile', auth, authController.getProfile);
// router.put('/profile', auth, authController.updateProfile);

module.exports = router;
