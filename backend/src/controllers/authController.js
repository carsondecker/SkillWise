// src/controllers/authController.js
const { z } = require('zod');
const authService = require('../services/authService');
const { generateAccessToken, generateRefreshToken, setAuthCookies, clearAuthCookies } = require('../utils/jwt');
const { asyncHandler } = require('../utils/helpers');
const jwt = require('../utils/jwt');

// ✅ Validation Schemas (Zod)
const registerSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// ✅ Auth Controller
const authController = {
  // -------------------------
  // User Registration
  // -------------------------
  register: asyncHandler(async (req, res) => {
    const payload = registerSchema.parse(req.body);

    const { user } = await authService.register(payload);
    const accessToken = generateAccessToken({ id: user.id, role: user.role });
    const refreshToken = generateRefreshToken({ id: user.id, role: user.role });


    await authService.storeRefreshToken(user.id, refreshToken);
    setAuthCookies(res, accessToken, refreshToken);
    console.log('🪪 TOKEN PAYLOAD (controller):', jwt.verifyRefreshToken(refreshToken));

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  }),

  // -------------------------
  // User Login
  // -------------------------
  // src/controllers/authController.js (fixed login)
  login: asyncHandler(async (req, res) => {
    const { email, password } = loginSchema.parse(req.body);

    const { user, accessToken, refreshToken } = await authService.login(email, password);

    await authService.storeRefreshToken(user.id, refreshToken);
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      message: 'Login successful',
      user: {
        id: user.id,
        firstName: user.first_name,
        lastName: user.last_name,
        email: user.email,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  }),

  logout: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (refreshToken) await authService.revokeRefreshToken(refreshToken);

    clearAuthCookies(res);
    res.status(204).end();
  }),

  refreshToken: asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken)
      return res.status(401).json({ message: 'No refresh token provided' });

    const user = await authService.verifyRefreshToken(refreshToken);
    const newAccessToken = generateAccessToken({ id: user.id, role: user.role });
    const newRefreshToken = generateRefreshToken({ id: user.id, role: user.role });

    await authService.rotateRefreshToken(refreshToken, newRefreshToken);
    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({
      message: 'Token refreshed successfully',
      accessToken: newAccessToken,  //  essential for frontend restore
    });
  }),
};

module.exports = authController;
