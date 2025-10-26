const authService = require('../services/authService');
const { successWithData } = require('../utils/responses');

const authController = {
  login: async (req, res, next) => {
    try {
      const { email, password } = req.body;
      const tokens = await authService.login(email, password);
      const loginData = {
        token: tokens.token,
      };
      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        path: '/auth/refresh',
      });
      return successWithData(res, 200, loginData);
    } catch (error) {
      next(error);
    }
  },

  register: async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const newUser = await authService.register(
        email,
        password,
        firstName,
        lastName,
      );
      return successWithData(res, 201, newUser);
    } catch (error) {
      next(error);
    }
  },

  // TODO: Add logout endpoint
  logout: async (req, res, next) => {
    // Implementation needed
  },

  // TODO: Add refresh token endpoint
  refreshToken: async (req, res, next) => {
    // Implementation needed
  },
};

module.exports = authController;
