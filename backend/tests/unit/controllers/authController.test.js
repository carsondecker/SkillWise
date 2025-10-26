const authController = require('../../../src/controllers/authController');
const authService = require('../../../src/services/authService');
const jwtUtils = require('../../../src/utils/jwt');

jest.mock('../../../src/services/authService');
jest.mock('../../../src/utils/jwt');

describe('authController', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = { body: {}, cookies: {}, user: {} };
    res = {
      cookie: jest.fn(),
      clearCookie: jest.fn(),
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('login: sets refresh cookie and returns token', async () => {
    req.body = { email: 'a@b.com', password: 'pass' };
    authService.login.mockResolvedValue({ token: 'tok', refreshToken: 'r' });

    await authController.login(req, res, next);

    expect(authService.login).toHaveBeenCalledWith('a@b.com', 'pass');
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'r',
      expect.any(Object),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: 'tok' },
    });
    expect(next).not.toHaveBeenCalled();
  });

  test('register: returns created user', async () => {
    req.body = {
      email: 'x@y.com',
      password: 'p',
      firstName: 'F',
      lastName: 'L',
    };
    const created = { email: 'x@y.com' };
    authService.register.mockResolvedValue(created);

    await authController.register(req, res, next);

    expect(authService.register).toHaveBeenCalledWith('x@y.com', 'p', 'F', 'L');
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith({ success: true, data: created });
  });

  test('logout: clears cookie and calls service', async () => {
    req.user = { id: 5 };
    authService.logout.mockResolvedValue();

    await authController.logout(req, res, next);

    expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', {
      path: '/auth/refresh',
    });
    expect(authService.logout).toHaveBeenCalledWith(5);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({ success: true });
  });

  test('refreshToken: missing cookie calls next with error', async () => {
    req.cookies = {};

    await authController.refreshToken(req, res, next);

    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/refresh token/i);
  });

  test('refreshToken: valid flow sets new cookie and returns token', async () => {
    req.cookies = { refreshToken: 'rt' };
    jwtUtils.verifyRefreshToken.mockReturnValue({ id: 1, email: 'u@e' });
    authService.refreshToken.mockResolvedValue('newToken');
    authService.createRefreshToken.mockResolvedValue('newRefresh');
    authService.revokeRefreshToken.mockResolvedValue();

    await authController.refreshToken(req, res, next);

    expect(jwtUtils.verifyRefreshToken).toHaveBeenCalledWith('rt');
    expect(authService.refreshToken).toHaveBeenCalledWith('rt', 1, 'u@e');
    expect(authService.createRefreshToken).toHaveBeenCalledWith(1, 'u@e');
    expect(res.cookie).toHaveBeenCalledWith(
      'refreshToken',
      'newRefresh',
      expect.any(Object),
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      success: true,
      data: { token: 'newToken' },
    });
  });
});
