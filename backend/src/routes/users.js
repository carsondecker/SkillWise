// src/routes/users.js
const express = require('express');
const router = express.Router();
const uploadAvatar = require('../middleware/uploadAvatar');
const userController = require('../controllers/userController');
const auth = require('../middleware/auth');

// --------------------------------------------------
// 🔹 User Management Routes (Protected)
// --------------------------------------------------
router.put(
  '/profile/avatar',
  auth,
  uploadAvatar.single('avatar'),
  userController.updateProfileAvatar
);
// 🟢 Get current user's profile
router.get('/profile', auth, userController.getProfile);

// 🟡 Update user profile
// Expected body: { name?, bio?, avatarUrl?, preferences? }
router.put('/profile', auth, userController.updateProfile);

// 🔵 Get user statistics (activity, goals completed, points, etc.)
router.get('/statistics', auth, userController.getStatistics);

// 🔴 Delete user account (soft or hard delete depending on service logic)
router.delete('/account', auth, userController.deleteAccount);

module.exports = router;
