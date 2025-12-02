const { z } = require('zod');
const userService = require('../services/userService');
const { asyncHandler } = require('../utils/helpers');

// ✅ Converts DB fields → frontend camelCase
const toCamelCase = (user) => ({
  id: user.id,
  email: user.email,
  firstName: user.first_name,
  lastName: user.last_name,
  bio: user.bio,
  profileImage: user.profile_image,
  role: user.role,
  isActive: user.is_active,
  createdAt: user.created_at,
});

// ✅ Converts frontend → DB (for updates)
const toSnakeCase = (data) => ({
  first_name: data.firstName,
  last_name: data.lastName,
  bio: data.bio,
  profile_image: data.profileImage, // ✅ correct mapping
});

// ✅ Validation schema (camelCase for frontend)
const updateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name cannot be empty').optional(),
  lastName: z.string().min(1, 'Last name cannot be empty').optional(),
  bio: z.string().max(500).optional(),
  profileImage: z.string().url().optional(),
});

const userController = {
  // 👤 Get logged-in user's profile
  getProfile: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const user = await userService.getProfile(userId);
    res.json({ user: toCamelCase(user) });
  }),

  updateProfileAvatar: asyncHandler(async (req, res) => {
    const userId = req.user?.id;

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Build public URL to file
    const fileUrl = `/uploads/avatars/${req.file.filename}`;

    const updatedUser = await userService.updateAvatar(userId, fileUrl);

    res.json({
      message: 'Profile image updated successfully',
      profileImage: fileUrl,
      user: toCamelCase(updatedUser),
    });
  }),
  // ✏️ Update user profile
  updateProfile: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const payload = updateProfileSchema.parse(req.body);
    const dbPayload = toSnakeCase(payload);

    const updatedUser = await userService.updateProfile(userId, dbPayload);
    res.json({
      message: 'Profile updated successfully',
      user: toCamelCase(updatedUser),
    });
  }),

  // 📊 Get user statistics
  getStatistics: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const stats = await userService.getStatistics(userId);
    res.json({ statistics: stats });
  }),

  // ❌ Delete user account
  deleteAccount: asyncHandler(async (req, res) => {
    const userId = req.user?.id;
    const result = await userService.deleteAccount(userId);
    res.json(result);
  }),
};

module.exports = userController;
