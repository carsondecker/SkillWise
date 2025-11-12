const authService = require('../services/authService');
const { asyncHandler } = require('../utils/helpers');
const db = require('../database/connection');
const jwt = require('../utils/jwt');
const {
  setAuthCookies,
  clearAuthCookies,
  generateAccessToken,
  generateRefreshToken,
} = require('../utils/jwt');
const { AppError } = require('../middleware/errorHandler');

// ✅ Auth Controller
const authController = {
  // -------------------------
  // User Registration
  // -------------------------
  register: asyncHandler(async (req, res, next) => {
    try {
      const payload = req.validated?.body || req.body;
      const { user } = await authService.register(payload);

      const accessToken = generateAccessToken({ id: user.id, role: user.role });
      const refreshToken = generateRefreshToken({
        id: user.id,
        role: user.role,
      });

      await authService.storeRefreshToken(user.id, refreshToken);
      setAuthCookies(res, accessToken, refreshToken);

      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          firstName: user.first_name,
          lastName: user.last_name,
          email: user.email,
        },
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }),

  // -------------------------
  // User Login
  // -------------------------
  login: asyncHandler(async (req, res, next) => {
    try {
      const { email, password } = req.validated?.body || req.body;
      const { user, accessToken, refreshToken } = await authService.login(
        email,
        password,
      );

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
        tokens: { accessToken, refreshToken },
      });
    } catch (error) {
      next(error);
    }
  }),

  // -------------------------
  // Logout
  // -------------------------
  logout: asyncHandler(async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (refreshToken) {
        try {
          const decoded = jwt.verifyRefreshToken(refreshToken);
          // Remove all refresh tokens belonging to the user
          await db.query('DELETE FROM refresh_tokens WHERE user_id = $1', [
            decoded.id,
          ]);
        } catch (err) {
          console.warn('⚠️ Invalid or missing refresh token during logout');
        }
      }

      clearAuthCookies(res);
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  }),

  // -------------------------
  // Refresh Token
  // -------------------------
  refreshToken: asyncHandler(async (req, res, next) => {
    try {
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken)
        throw new AppError('No refresh token provided', 401, 'NO_TOKEN');

      const user = await authService.verifyRefreshToken(refreshToken);
      const newAccessToken = generateAccessToken({
        id: user.id,
        role: user.role,
      });
      const newRefreshToken = generateRefreshToken({
        id: user.id,
        role: user.role,
      });

      await authService.rotateRefreshToken(refreshToken, newRefreshToken);
      setAuthCookies(res, newAccessToken, newRefreshToken);

      res.json({
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
      });
    } catch (error) {
      next(error);
    }
  }),
};

module.exports = authController;
