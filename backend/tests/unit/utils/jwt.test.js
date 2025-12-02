const ORIGINAL_ENV = { ...process.env };

describe('JWT Utils', () => {
  let jwtUtils;

  beforeEach(() => {
    jest.resetModules();
    process.env = {
      ...ORIGINAL_ENV,
      JWT_SECRET: 'test-secret',
      JWT_REFRESH_SECRET: 'refresh-secret',
      JWT_RESET_SECRET: 'reset-secret',
    };

    jwtUtils = require('../../../src/utils/jwt');
  });

  afterEach(() => {
    process.env = { ...ORIGINAL_ENV };
  });

  describe('signAccessToken', () => {
    test('generates a signed token', () => {
      const token = jwtUtils.signAccessToken({ userId: 123 });
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    test('embeds payload values', () => {
      const token = jwtUtils.signAccessToken({ userId: 42, role: 'student' });
      const decoded = jwtUtils.verifyAccessToken(token);

      expect(decoded.userId).toBe(42);
      expect(decoded.role).toBe('student');
    });
  });

  describe('verifyAccessToken', () => {
    test('returns decoded payload for valid tokens', () => {
      const token = jwtUtils.signAccessToken({ email: 'user@example.com' });
      const decoded = jwtUtils.verifyAccessToken(token);

      expect(decoded.email).toBe('user@example.com');
    });

    test('throws when token is tampered with', () => {
      const token = jwtUtils.signAccessToken({ email: 'user@example.com' });
      const tampered = `${token}broken`;

      expect(() => jwtUtils.verifyAccessToken(tampered)).toThrow(
        'Invalid access token'
      );
    });
  });

  describe('setAuthCookies', () => {
    test('sets access and refresh cookies with security flags', () => {
      const res = {
        cookie: jest.fn(),
      };

      jwtUtils.setAuthCookies(res, 'access-token', 'refresh-token');

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'access-token',
        expect.objectContaining({ httpOnly: true, path: '/' })
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'refresh-token',
        expect.objectContaining({ httpOnly: true, path: '/' })
      );
    });
  });
});
