import { validate, validateOrThrow } from '../../../common/validation/validators';
import { EmailSchema, PasswordSchema } from '../../../common/validation/schemas';

describe('Validation Validators', () => {
  describe('validate', () => {
    it('should validate valid email', () => {
      const result = validate(EmailSchema, 'test@example.com');
      expect(result.success).toBe(true);
      expect(result.data).toBe('test@example.com');
    });

    it('should reject invalid email', () => {
      const result = validate(EmailSchema, 'invalid');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
    });

    it('should validate valid password', () => {
      const result = validate(PasswordSchema, 'Password123');
      expect(result.success).toBe(true);
      expect(result.data).toBe('Password123');
    });

    it('should reject short password', () => {
      const result = validate(PasswordSchema, 'Abc1');
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should handle null input', () => {
      const result = validate(EmailSchema, null);
      expect(result.success).toBe(false);
    });

    it('should handle undefined input', () => {
      const result = validate(EmailSchema, undefined);
      expect(result.success).toBe(false);
    });

    it('should handle non-string input', () => {
      const result = validate(EmailSchema, 123);
      expect(result.success).toBe(false);
    });
  });

  describe('formatZodError', () => {
    it('should format ZodError correctly', () => {
      const invalidEmail = 'not-an-email';
      const result = validate(EmailSchema, invalidEmail);
      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
      if (result.errors) {
        expect(result.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('validateOrThrow', () => {
    it('should return data for valid input', () => {
      const result = validateOrThrow(EmailSchema, 'test@example.com');
      expect(result).toBe('test@example.com');
    });

    it('should throw for invalid input', () => {
      expect(() => {
        validateOrThrow(EmailSchema, 'invalid', 'email');
      }).toThrow();
    });
  });
});
