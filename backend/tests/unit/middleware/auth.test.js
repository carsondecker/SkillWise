const { AppError } = require('../../../src/middleware/errorHandler');
const jwt = require('jsonwebtoken');
const auth = require('../../../src/middleware/auth');

jest.mock('jsonwebtoken');

describe('auth middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: {} };
    res = {};
    next = jest.fn();
    jest.clearAllMocks();
  });

  test('missing token -> next called with NO_TOKEN AppError', async () => {
    await auth(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err).toBeInstanceOf(Error);
    expect(err.message).toMatch(/not logged in/i);
  });

  test('invalid token (JsonWebTokenError) -> INVALID_TOKEN AppError', async () => {
    req.headers.authorization = 'Bearer bad';
    jwt.verify.mockImplementation(() => {
      const e = new Error('bad');
      e.name = 'JsonWebTokenError';
      throw e;
    });
    await auth(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/Invalid token/i);
  });

  test('expired token -> TOKEN_EXPIRED AppError', async () => {
    req.headers.authorization = 'Bearer bad';
    jwt.verify.mockImplementation(() => {
      const e = new Error('expired');
      e.name = 'TokenExpiredError';
      throw e;
    });
    await auth(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/expired/i);
  });

  test('valid token without id -> INVALID_TOKEN AppError', async () => {
    req.headers.authorization = 'Bearer ok';
    jwt.verify.mockReturnValue({});
    await auth(req, res, next);
    expect(next).toHaveBeenCalled();
    const err = next.mock.calls[0][0];
    expect(err.message).toMatch(/missing id claim/i);
  });

  test('restrictTo middleware denies when role not included', () => {
    const { restrictTo } = require('../../../src/middleware/auth');
    const mid = restrictTo('admin');
    const req2 = { user: { role: 'user' } };
    const next2 = jest.fn();
    mid(req2, res, next2);
    expect(next2).toHaveBeenCalled();
    const err = next2.mock.calls[0][0];
    expect(err.message).toMatch(/permission/i);
  });
});
