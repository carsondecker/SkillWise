const validation = require('../../../src/middleware/validation');
const { AppError } = require('../../../src/middleware/errorHandler');

const createMock = (body = {}) => {
  const req = { body, query: {}, params: {} };
  const res = {};
  const next = jest.fn();
  return { req, res, next };
};

describe('Validation Middleware', () => {
  describe('loginValidation', () => {
    test('passes through valid login data', () => {
      const { req, res, next } = createMock({
        email: 'user@example.com',
        password: 'Password123',
      });

      validation.loginValidation(req, res, next);

      expect(req.validated.body.email).toBe('user@example.com');
      expect(next).toHaveBeenCalledWith();
    });

    test('rejects invalid email', () => {
      const { req, res, next } = createMock({
        email: 'not-an-email',
        password: 'Password123',
      });

      validation.loginValidation(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toMatch(/Invalid email format/);
    });
  });

  describe('registerValidation', () => {
    const basePayload = {
      email: 'user@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      firstName: 'John',
      lastName: 'Doe',
    };

    test('accepts valid registration data', () => {
      const { req, res, next } = createMock(basePayload);

      validation.registerValidation(req, res, next);

      expect(req.validated.body.firstName).toBe('John');
      expect(next).toHaveBeenCalledWith();
    });

    test('enforces password complexity', () => {
      const { req, res, next } = createMock({
        ...basePayload,
        password: 'simple',
        confirmPassword: 'simple',
      });

      validation.registerValidation(req, res, next);

      const error = next.mock.calls[0][0];
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toMatch(/Password must contain/);
    });
  });
});
