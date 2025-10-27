// src/routes/auth.js
const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const { loginValidation, registerValidation } = require('../middleware/validation');
const auth = require('../middleware/auth');

// 🔹 AUTH ROUTES
// --------------------------------------------------

// 🟢 Register new user
router.post('/register', registerValidation, authController.register);

// 🟢 Login existing user
router.post('/login', loginValidation, authController.login);

// 🔵 Logout current session
router.post('/logout', authController.logout);

// 🟡 Refresh access token
router.post('/refresh', authController.refreshToken);

// ⚪️ Optional future expansion: Forgot/Reset Password
// router.post('/forgot-password', authController.forgotPassword);
// router.post('/reset-password', authController.resetPassword);

// 🟣 Authenticated routes (profile)
// router.get('/profile', auth, authController.getProfile);
// router.put('/profile', auth, authController.updateProfile);

module.exports = router;
