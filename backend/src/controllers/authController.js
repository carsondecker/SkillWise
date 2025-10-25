const authService = require('../services/authService');

const authController = {
  // TODO: Add login endpoint
  login: async (req, res, next) => {
    // Implementation needed
  },

  // TODO: Add register endpoint
  register: async (req, res, next) => {
    try {
      const { email, password, firstName, lastName } = req.body;
      const newUser = await authService.register({
        email,
        password,
        firstName,
        lastName,
      });
      return res.status(201).json({ status: 'success', data: newUser });
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
