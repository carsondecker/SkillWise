// validators utility unit tests
const validators = require('../../../src/utils/validators');

describe('Validators', () => {
  describe('validateEmail', () => {
    test('should validate correct email formats', () => {
      expect(validators.validateEmail('user@example.com')).toBe(true);
      expect(validators.validateEmail('first.last+tag@sub.domain.co')).toBe(
        true
      );
    });

    test('should reject invalid email formats', () => {
      expect(validators.validateEmail('not-an-email')).toBe(false);
      expect(validators.validateEmail('user@.com')).toBe(false);
      expect(validators.validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should validate strong passwords', () => {
      const strong = validators.validatePassword('Str0ng@Pass');
      expect(strong.isValid).toBe(true);
      expect(strong.errors.length).toBe(0);
    });

    test('should reject weak passwords', () => {
      const tooShort = validators.validatePassword('short');
      expect(tooShort.isValid).toBe(false);
      const missingComplex = validators.validatePassword('alllowercase1');
      expect(missingComplex.isValid).toBe(false);
    });
  });
});
