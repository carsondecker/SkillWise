jest.mock('../../../src/database/connection', () => ({
  query: jest.fn(),
}));

jest.mock('../../../src/utils/jwt', () => ({
  signAccessToken: jest.fn(() => 'access-token'),
  signRefreshToken: jest.fn(() => 'refresh-token'),
  verifyRefreshToken: jest.fn(() => ({})),
}));

const bcrypt = require('bcryptjs');
const db = require('../../../src/database/connection');
const authService = require('../../../src/services/authService');
const { AppError } = require('../../../src/middleware/errorHandler');

describe('Auth Service', () => {
  beforeAll(() => {
    process.env.JWT_SECRET = 'test-secret';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    test('should login a user with correct credentials', async () => {
      const password = 'Password1';
      const hash = await bcrypt.hash(password, 10);

      db.query.mockImplementation((sql, params) => {
        if (sql.includes('SELECT * FROM users WHERE email')) {
          return Promise.resolve({
            rows: [
              {
                id: 1,
                email: 'u@x.com',
                password_hash: hash,
                first_name: 'A',
                last_name: 'B',
                role: 'student',
              },
            ],
          });
        }
        // Insert refresh token or other writes
        return Promise.resolve({ rows: [] });
      });

      // ensure verify returns a usable payload
      const jwtMock = require('../../../src/utils/jwt');
      jwtMock.verifyRefreshToken.mockReturnValue({ id: 1 });

      const result = await authService.login('u@x.com', password);
      expect(result).toHaveProperty('user');
      expect(db.query).toHaveBeenCalled();
    });

    test('should throw on invalid email', async () => {
      db.query.mockResolvedValue({ rows: [] });
      await expect(authService.login('noone@x.com', 'pass')).rejects.toThrow(
        AppError
      );
    });
  });

  describe('register', () => {
    test('should throw when email already exists', async () => {
      db.query.mockImplementation((sql) => {
        if (sql.includes('SELECT id FROM users WHERE email'))
          return Promise.resolve({ rows: [{ id: 1 }] });
        return Promise.resolve({ rows: [] });
      });

      await expect(
        authService.register({
          email: 'a@b.com',
          password: 'Password1',
          firstName: 'X',
          lastName: 'Y',
        })
      ).rejects.toThrow(AppError);
    });

    test('should register a new user', async () => {
      db.query.mockImplementation((sql) => {
        if (sql.includes('SELECT id FROM users WHERE email'))
          return Promise.resolve({ rows: [] });
        if (sql.includes('INSERT INTO users'))
          return Promise.resolve({
            rows: [
              {
                id: 2,
                email: 'a@b.com',
                first_name: 'X',
                last_name: 'Y',
                role: 'student',
              },
            ],
          });
        return Promise.resolve({ rows: [] });
      });

      const jwtMock = require('../../../src/utils/jwt');
      jwtMock.verifyRefreshToken.mockReturnValue({ id: 2 });

      const res = await authService.register({
        email: 'a@b.com',
        password: 'Password1',
        firstName: 'X',
        lastName: 'Y',
      });
      expect(res).toHaveProperty('user');
      expect(res.user).toHaveProperty('id', 2);
    });
  });
});
