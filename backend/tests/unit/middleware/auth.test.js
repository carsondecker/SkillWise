const jwt = require('jsonwebtoken');
const auth = require('../../../src/middleware/auth');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  const next = jest.fn();
  const res = {};

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.JWT_SECRET = 'secret';
  });

  test('authenticates a valid Bearer token and attaches user', async () => {
    const req = {
      headers: { authorization: 'Bearer token123' },
      cookies: {},
    };
    jwt.verify.mockReturnValue({ id: 1, role: 'user' });

    await auth(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith('token123', 'secret');
    expect(req.user).toEqual({ id: 1, role: 'user' });
    expect(next).toHaveBeenCalledWith();
  });

  test('rejects missing token with AppError', async () => {
    const req = { headers: {}, cookies: {} };

    await auth(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('NO_TOKEN');
  });

  test('rejects invalid token', async () => {
    const req = { headers: { authorization: 'Bearer bad' }, cookies: {} };
    jwt.verify.mockImplementation(() => {
      const err = new Error('bad');
      err.name = 'JsonWebTokenError';
      throw err;
    });

    await auth(req, res, next);

    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.code).toBe('INVALID_TOKEN');
  });

  test('sets tokenExpired flag when token expired', async () => {
    const req = { headers: { authorization: 'Bearer old' }, cookies: {} };
    jwt.verify.mockImplementation(() => {
      const err = new Error('expired');
      err.name = 'TokenExpiredError';
      throw err;
    });

    await auth(req, res, next);

    expect(req.tokenExpired).toBe(true);
    expect(next).toHaveBeenCalledWith();
  });
});
