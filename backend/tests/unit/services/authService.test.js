const bcrypt = require('bcryptjs');
const jwt = require('../../../src/utils/jwt');
const db = require('../../../src/database/connection');
const { AppError } = require('../../../src/middleware/errorHandler');

jest.mock('../../../src/database/connection', () => ({
  query: jest.fn(),
}));

jest.mock('bcryptjs');
jest.mock('../../../src/utils/jwt', () => ({
  signAccessToken: jest.fn(),
  signRefreshToken: jest.fn(),
  verifyRefreshToken: jest.fn(),
}));

const authService = require('../../../src/services/authService');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const userRow = {
      id: 1,
      email: 'user@example.com',
      password_hash: 'hashed',
      role: 'student',
      first_name: 'Test',
      last_name: 'User',
    };

    test('authenticates valid user and returns tokens', async () => {
      db.query
        .mockResolvedValueOnce({ rows: [userRow] }) // fetch user
        .mockResolvedValueOnce({}); // insert refresh token
      bcrypt.compare.mockResolvedValue(true);
      jwt.signAccessToken.mockReturnValue('access');
      jwt.signRefreshToken.mockReturnValue('refresh');
      jwt.verifyRefreshToken.mockReturnValue({ id: 1 });

      const result = await authService.login('user@example.com', 'Password1!');

      expect(result.accessToken).toBe('access');
      expect(result.refreshToken).toBe('refresh');
      expect(db.query).toHaveBeenCalledTimes(2);
    });

    test('throws on invalid password', async () => {
      db.query.mockResolvedValue({ rows: [userRow] });
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login('user@example.com', 'wrong')
      ).rejects.toBeInstanceOf(AppError);
    });
  });

  describe('verifyRefreshToken', () => {
    test('throws when token not found in DB', async () => {
      jwt.verifyRefreshToken.mockReturnValue({ id: 1 });
      db.query.mockResolvedValueOnce({ rows: [] });

      await expect(
        authService.verifyRefreshToken('token')
      ).rejects.toBeInstanceOf(AppError);
    });
  });
});
