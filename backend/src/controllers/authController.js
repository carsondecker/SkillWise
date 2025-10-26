const { AppError } = require('../middleware/errorHandler');
const authService = require('../services/authService');
const { verifyRefreshToken } = require('../utils/jwt');
const { successWithData, success } = require('../utils/responses');

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
        secure: false, // temp: switch to true
        sameSite: 'strict',
        path: '/auth/refresh',
      });
      return successWithData(res, 200, loginData);
    } catch (err) {
      next(err);
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
    } catch (err) {
      next(err);
    }
  },

  logout: async (req, res, next) => {
    try {
      res.clearCookie('refreshToken', { path: '/auth/refresh' });
      await authService.logout(req.user.id);
      return success(res, 200);
    } catch (err) {
      next(err);
    }
  },

  refreshToken: async (req, res, next) => {
    try {
      console.log(req.cookies);
      const refreshToken = req.cookies?.refreshToken;
      if (!refreshToken) {
        throw new AppError('No refresh token provided', 401);
      }
      const { id, email } = verifyRefreshToken(refreshToken);
      console.log({ id, email });
      const token = await authService.refreshToken(refreshToken);
      const refreshData = {
        token,
      };
      const newRefreshToken = await authService.createRefreshToken(id, email);
      res.cookie('refreshToken', newRefreshToken, {
        httpOnly: true,
        secure: false, // temp: switch to true
        sameSite: 'strict',
        path: '/auth/refresh',
      });
      await authService.revokeRefreshToken(refreshToken);
      return successWithData(res, 200, refreshData);
    } catch (err) {
      next(err);
    }
  },
};

module.exports = authController;
