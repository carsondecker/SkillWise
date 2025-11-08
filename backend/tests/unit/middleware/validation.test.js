const validation = require('../../../src/middleware/validation');
const { AppError } = require('../../../src/middleware/errorHandler');

describe('Validation Middleware', () => {
  const makeReq = (body = {}) => ({ body, query: {}, params: {} });

  describe('loginValidation', () => {
    test('should validate correct login data', () => {
      const req = makeReq({ email: 'a@b.com', password: 'pass' });
      const next = jest.fn();
      validation.loginValidation(req, {}, next);
      expect(next).toHaveBeenCalledWith();
      expect(req).toHaveProperty('validated');
      expect(req.validated.body.email).toBe('a@b.com');
    });

    test('should reject invalid email format', () => {
      const req = makeReq({ email: 'bad', password: '' });
      const next = jest.fn();
      validation.loginValidation(req, {}, next);
      expect(next).toHaveBeenCalled();
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(/Invalid email format|Password is required/);
    });
  });

  describe('registerValidation', () => {
    test('should validate registration data', () => {
      const req = makeReq({
        email: 'u@x.com',
        password: 'Password1',
        confirmPassword: 'Password1',
        firstName: 'A',
        lastName: 'B',
      });
      const next = jest.fn();
      validation.registerValidation(req, {}, next);
      expect(next).toHaveBeenCalledWith();
      expect(req.validated.body.email).toBe('u@x.com');
    });

    test('should enforce password requirements', () => {
      const req = makeReq({
        email: 'u@x.com',
        password: 'short',
        confirmPassword: 'short',
        firstName: 'A',
        lastName: 'B',
      });
      const next = jest.fn();
      validation.registerValidation(req, {}, next);
      const err = next.mock.calls[0][0];
      expect(err).toBeInstanceOf(AppError);
      expect(err.message).toMatch(
        /Password must be at least 8 characters|contain at least one lowercase/
      );
    });
  });
});
