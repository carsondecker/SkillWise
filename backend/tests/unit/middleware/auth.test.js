const jwt = require('jsonwebtoken');
const auth = require('../../../src/middleware/auth');
const { AppError } = require('../../../src/middleware/errorHandler');

describe('Auth Middleware', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  test('should authenticate valid JWT token', () => {
    const token = jwt.sign({ id: 1, role: 'student' }, process.env.JWT_SECRET);
    const req = { headers: { authorization: `Bearer ${token}` }, cookies: {} };
    const res = {};
    const next = jest.fn();
    auth(req, res, next);
    expect(next).toHaveBeenCalledWith();
    expect(req).toHaveProperty('user');
    expect(req.user).toHaveProperty('id', 1);
  });

  test('should reject invalid token', () => {
    const req = {
      headers: { authorization: 'Bearer bad.token.here' },
      cookies: {},
    };
    const next = jest.fn();
    auth(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/Invalid token/);
  });

  test('should reject expired token', () => {
    // create token with exp in past
    const expired = jwt.sign({ id: 2 }, process.env.JWT_SECRET, {
      expiresIn: -10,
    });
    const req = {
      headers: { authorization: `Bearer ${expired}` },
      cookies: {},
    };
    const next = jest.fn();
    auth(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/expired/);
  });

  test('should reject missing token', () => {
    const req = { headers: {}, cookies: {} };
    const next = jest.fn();
    auth(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/You are not logged in/);
  });

  test('restrictTo denies unauthorized role', () => {
    const { restrictTo } = require('../../../src/middleware/auth');
    const middleware = restrictTo('admin');
    const req = { user: { id: 1, role: 'student' } };
    const next = jest.fn();
    middleware(req, {}, next);
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(AppError);
    expect(err.message).toMatch(/permission/);
  });
});
