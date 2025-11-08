// JWT utility unit tests
describe('JWT Utils', () => {
  beforeAll(() => {
    // ensure deterministic secrets for tests
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret';
    process.env.JWT_RESET_SECRET = 'test-reset-secret';
  });

  afterAll(() => {
    delete process.env.JWT_SECRET;
    delete process.env.JWT_REFRESH_SECRET;
    delete process.env.JWT_RESET_SECRET;
  });

  test('should generate and verify access token with payload', () => {
    jest.resetModules();
    const jwtUtils = require('../../../src/utils/jwt');

    const payload = { id: 42, role: 'student' };
    const token = jwtUtils.signAccessToken(payload);
    expect(typeof token).toBe('string');

    const decoded = jwtUtils.verifyAccessToken(token);
    expect(decoded.id).toBe(payload.id);
    expect(decoded.role).toBe(payload.role);
  });

  test('should reject tampered access token', () => {
    jest.resetModules();
    const jwtUtils = require('../../../src/utils/jwt');

    const payload = { id: 1 };
    const token = jwtUtils.signAccessToken(payload);
    // tamper token by altering a character
    const tampered = token.replace(/.(?=.{10}$)/, 'x');
    expect(() => jwtUtils.verifyAccessToken(tampered)).toThrow();
  });
});
