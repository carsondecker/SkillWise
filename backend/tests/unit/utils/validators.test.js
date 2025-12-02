const {
  validateEmail,
  validatePassword,
  sanitizeString,
  validateFileUpload,
} = require('../../../src/utils/validators');

describe('Validators', () => {
  describe('validateEmail', () => {
    test('accepts valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    test('rejects malformed email', () => {
      expect(validateEmail('not-an-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('accepts strong password', () => {
      const result = validatePassword('StrongPass1!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toEqual([]);
    });

    test('rejects weak password with useful message', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must be at least 8 characters');
    });

    test('requires uppercase characters', () => {
      const result = validatePassword('lowercase1!');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain(
        'Password must contain at least one uppercase letter'
      );
    });
  });

  describe('sanitizeString', () => {
    test('strips angle brackets and script protocol', () => {
      const sanitized = sanitizeString(
        "<script>javascript:alert('xss')</script>"
      );
      expect(sanitized).not.toContain('<');
      expect(sanitized).not.toContain('>');
      expect(sanitized.toLowerCase()).not.toContain('javascript:');
    });
  });

  describe('validateFileUpload', () => {
    test('accepts valid image upload', () => {
      const result = validateFileUpload({
        size: 1024,
        mimetype: 'image/png',
        originalname: 'avatar.png',
      });

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('rejects oversized upload', () => {
      const result = validateFileUpload({
        size: 6 * 1024 * 1024,
        mimetype: 'image/jpeg',
        originalname: 'large.jpg',
      });

      expect(result.isValid).toBe(false);
      expect(result.errors[0]).toBe('File size exceeds 5MB limit');
    });
  });
});
