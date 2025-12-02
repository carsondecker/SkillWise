const authService = require('../../../src/services/authService');
const jwtUtils = require('../../../src/utils/jwt');
const db = require('../../../src/database/connection');
const authController = require('../../../src/controllers/authController');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/services/authService', () => ({
  register: jest.fn(),
  login: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../../../src/utils/jwt', () => ({
  setAuthCookies: jest.fn(),
  clearAuthCookies: jest.fn(),
  generateAccessToken: jest.fn().mockReturnValue('access'),
  generateRefreshToken: jest.fn().mockReturnValue('refresh'),
  verifyRefreshToken: jest.fn(),
}));

jest.mock('../../../src/database/connection', () => ({
  query: jest.fn(),
}));

describe('Auth Controller', () => {
  const mockRes = () => {
    const res = {};
    res.status = jest.fn().mockReturnValue(res);
    res.json = jest.fn().mockReturnValue(res);
    res.end = jest.fn();
    res.cookie = jest.fn();
    res.clearCookie = jest.fn();
    return res;
  };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NODE_ENV = 'test';
  });

  test('register returns created user payload', async () => {
    authService.register.mockResolvedValue({
      user: {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'u@test.com',
        role: 'student',
      },
    });
    const req = {
      body: { email: 'u@test.com' },
      validated: { body: { email: 'u@test.com' } },
    };
    const res = mockRes();
    const next = jest.fn();

    await authController.register(req, res, next);

    expect(authService.register).toHaveBeenCalled();
    expect(jwtUtils.setAuthCookies).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Registration successful',
        user: expect.any(Object),
      })
    );
  });

  test('login returns access and refresh tokens', async () => {
    authService.login.mockResolvedValue({
      user: {
        id: 1,
        first_name: 'Test',
        last_name: 'User',
        email: 'u@test.com',
        role: 'student',
      },
      accessToken: 'access123',
      refreshToken: 'refresh123',
    });
    const req = {
      body: { email: 'u@test.com', password: 'pass' },
      validated: null,
    };
    const res = mockRes();
    const next = jest.fn();

    await authController.login(req, res, next);

    expect(authService.login).toHaveBeenCalledWith('u@test.com', 'pass');
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        message: 'Login successful',
        accessToken: 'access123',
      })
    );
  });

  test('logout clears cookies and deletes refresh token', async () => {
    jwtUtils.verifyRefreshToken.mockReturnValue({ id: 10 });
    const req = { cookies: { refreshToken: 'token' } };
    const res = mockRes();
    const next = jest.fn();

    await authController.logout(req, res, next);

    expect(db.query).toHaveBeenCalledWith(
      'DELETE FROM refresh_tokens WHERE user_id = $1',
      [10]
    );
    expect(jwtUtils.clearAuthCookies).toHaveBeenCalledWith(res);
    expect(res.status).toHaveBeenCalledWith(204);
  });

  test('refreshToken rejects when missing token', async () => {
    const req = { cookies: {}, body: {}, headers: {} };
    const res = mockRes();
    const next = jest.fn();

    await authController.refreshToken(req, res, next);

    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.code).toBe('NO_TOKEN');
  });
});
