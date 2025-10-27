// TODO: Implement authentication controller with login, register, logout, refresh token endpoints
const authService = require('../services/authService');

const authController = {
  // TODO: Add login endpoint
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Missing email or password' });
      }

      // Expect authService.login to return { user, accessToken, refreshToken }
      const result = await authService.login({ email, password });
      if (!result) {
        return res.status(401).json({ success: false, message: 'Invalid credentials' });
      }

      const { user, accessToken, refreshToken } = result;

      // Set refresh token as httpOnly cookie (if provided)
      if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
        });
      }

      return res.status(200).json({ success: true, data: { user, accessToken } });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Add register endpoint  
  register: async (req, res, next) => {
    try {
      const { name, email, password } = req.body || {};
      if (!email || !password) {
        return res.status(400).json({ success: false, message: 'Missing email or password' });
      }

      // Expect authService.register to return { user, accessToken, refreshToken }
      const result = await authService.register({ name, email, password });
      if (!result) {
        return res.status(400).json({ success: false, message: 'Registration failed' });
      }

      const { user, accessToken, refreshToken } = result;

      if (refreshToken) {
        res.cookie('refreshToken', refreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }

      return res.status(201).json({ success: true, data: { user, accessToken } });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Add logout endpoint
  logout: async (req, res, next) => {
    try {
      // Accept refresh token from cookie or body
      const refreshToken = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : req.body.refreshToken;
      const userId = req.user && req.user.id;

      if (!refreshToken && !userId) {
        // If no refresh token, still clear cookie for safety
        res.clearCookie('refreshToken');
        return res.status(400).json({ success: false, message: 'Missing refresh token or authenticated user' });
      }

      await authService.logout({ refreshToken, userId });

      res.clearCookie('refreshToken');
      return res.status(200).json({ success: true, message: 'Logged out' });
    } catch (err) {
      return next(err);
    }
  },

  // TODO: Add refresh token endpoint
  refreshToken: async (req, res, next) => {
    try {
      // Prefer cookie, fall back to body
      const refreshToken = req.cookies && req.cookies.refreshToken ? req.cookies.refreshToken : req.body.refreshToken;
      if (!refreshToken) {
        return res.status(400).json({ success: false, message: 'Missing refresh token' });
      }

      // Expect authService.refreshToken to return { accessToken, refreshToken: newRefreshToken, user }
      const result = await authService.refreshToken({ refreshToken });
      if (!result) {
        return res.status(401).json({ success: false, message: 'Invalid refresh token' });
      }

      const { accessToken, refreshToken: newRefreshToken, user } = result;

      if (newRefreshToken) {
        res.cookie('refreshToken', newRefreshToken, {
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'Strict',
          maxAge: 30 * 24 * 60 * 60 * 1000
        });
      }

      return res.status(200).json({ success: true, data: { accessToken, user } });
    } catch (err) {
      return next(err);
    }
  }
};

module.exports = authController;