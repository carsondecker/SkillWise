const authService = require('../../../src/services/authService');
const userService = require('../../../src/services/userService');
const db = require('../../../src/database/connection');
const jwt = require('../../../src/utils/jwt');
const bcrypt = require('bcryptjs');

jest.mock('../../../src/services/userService');
jest.mock('../../../src/database/connection');
jest.mock('../../../src/utils/jwt');
jest.mock('bcryptjs');

describe('authService', () => {
  beforeEach(() => jest.clearAllMocks());

  test('login success returns token and refreshToken', async () => {
    userService.getUserByEmail = jest
      .fn()
      .mockResolvedValue({ id: 1, email: 'a@b', password_hash: 'h' });
    bcrypt.compare = jest.fn().mockResolvedValue(true);
    jwt.generateToken = jest.fn().mockReturnValue('tok');
    jwt.generateRefreshToken = jest.fn().mockReturnValue('r');
    db.query = jest.fn().mockResolvedValue({ rows: [] });

    const res = await authService.login('a@b', 'pw');
    expect(res).toEqual({
      token: 'tok',
      refreshToken: 'r',
      user: { email: 'a@b', firstName: undefined, lastName: undefined },
    });
    expect(db.query).toHaveBeenCalled();
  });

  test('login wrong password throws AppError 401', async () => {
    userService.getUserByEmail = jest
      .fn()
      .mockResolvedValue({ id: 1, email: 'a@b', password_hash: 'h' });
    bcrypt.compare = jest.fn().mockResolvedValue(false);

    await expect(authService.login('a@b', 'pw')).rejects.toMatchObject({
      statusCode: 401,
    });
  });

  test('register calls createUser and returns user', async () => {
    bcrypt.hash = jest.fn().mockResolvedValue('hpw');
    userService.createUser = jest.fn().mockResolvedValue({ id: 2, email: 'x' });

    const u = await authService.register('x', 'p', 'F', 'L');
    expect(userService.createUser).toHaveBeenCalledWith({
      email: 'x',
      passwordHash: 'hpw',
      firstName: 'F',
      lastName: 'L',
    });
    expect(u).toEqual({ id: 2, email: 'x' });
  });

  test('refreshToken invalid token throws 401 AppError', async () => {
    db.query = jest.fn().mockResolvedValue({ rows: [] });
    await expect(authService.refreshToken('bad', 1, 'e')).rejects.toMatchObject(
      { statusCode: 401 },
    );
  });
});
