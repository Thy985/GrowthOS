import {
  validateEmail,
  validatePassword,
  validateRequired,
  validateLength,
  validateUrl,
  validateDate,
} from '../../common/validation/validators';

describe('Validation Validators', () => {
  describe('validateEmail', () => {
    it('should accept valid email addresses', () => {
      expect(validateEmail('test@example.com')).toBeNull();
      expect(validateEmail('user.name@domain.co.uk')).toBeNull();
      expect(validateEmail('user+tag@example.org')).toBeNull();
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('')).toBe('请输入邮箱地址');
      expect(validateEmail('invalid')).toBe('请输入有效的邮箱格式');
      expect(validateEmail('invalid@')).toBe('请输入有效的邮箱格式');
      expect(validateEmail('@domain.com')).toBe('请输入有效的邮箱格式');
      expect(validateEmail('user@.com')).toBe('请输入有效的邮箱格式');
    });

    it('should handle whitespace', () => {
      expect(validateEmail('  test@example.com  ')).toBeNull();
      expect(validateEmail('')).toBe('请输入邮箱地址');
    });
  });

  describe('validatePassword', () => {
    it('should accept valid passwords', () => {
      expect(validatePassword('Password123')).toBeNull();
      expect(validatePassword('MyP@ssw0rd!')).toBeNull();
      expect(validatePassword('abcdefgh')).toBeNull();
    });

    it('should reject empty passwords', () => {
      expect(validatePassword('')).toBe('请输入密码');
    });

    it('should reject short passwords', () => {
      expect(validatePassword('Abc1')).toBe('密码至少需要 8 个字符');
    });

    it('should require uppercase letter', () => {
      expect(validatePassword('password123')).toBe('密码需要包含至少一个大写字母');
    });

    it('should require lowercase letter', () => {
      expect(validatePassword('PASSWORD123')).toBe('密码需要包含至少一个小写字母');
    });

    it('should require a number', () => {
      expect(validatePassword('PasswordABC')).toBe('密码需要包含至少一个数字');
    });
  });

  describe('validateRequired', () => {
    it('should accept non-empty values', () => {
      expect(validateRequired('Hello')('test')).toBeNull();
      expect(validateRequired('Name')(123)).toBeNull();
      expect(validateRequired('Items')(['a', 'b'])).toBeNull();
    });

    it('should reject empty values', () => {
      expect(validateRequired('Field')('')).toBe('Field不能为空');
      expect(validateRequired('Field')('   ')).toBe('Field不能为空');
      expect(validateRequired('Field')(null as any)).toBe('Field不能为空');
      expect(validateRequired('Field')(undefined as any)).toBe('Field不能为空');
    });

    it('should allow zero and false', () => {
      expect(validateRequired('Count')(0)).toBeNull();
      expect(validateRequired('Active')(false)).toBeNull();
    });
  });

  describe('validateLength', () => {
    const validator = validateLength(5, 10, '用户名');

    it('should accept strings within length range', () => {
      expect(validator('hello')).toBeNull();
      expect(validator('hellooo')).toBeNull();
      expect(validator('helloworld')).toBeNull();
    });

    it('should reject strings too short', () => {
      expect(validator('hi')).toBe('用户名长度必须在5到10个字符之间');
    });

    it('should reject strings too long', () => {
      expect(validator('helloworld!')).toBe('用户名长度必须在5到10个字符之间');
    });

    it('should handle empty strings', () => {
      expect(validator('')).toBeNull();
    });
  });

  describe('validateUrl', () => {
    it('should accept valid URLs', () => {
      expect(validateUrl('https://example.com')).toBeNull();
      expect(validateUrl('http://example.com')).toBeNull();
      expect(validateUrl('https://example.com/path?query=value')).toBeNull();
      expect(validateUrl('https://example.com:8080')).toBeNull();
    });

    it('should reject invalid URLs', () => {
      expect(validateUrl('')).toBe('请输入有效的URL地址');
      expect(validateUrl('not-a-url')).toBe('请输入有效的URL地址');
      expect(validateUrl('ftp://example.com')).toBe('请输入有效的URL地址');
      expect(validateUrl('example.com')).toBe('请输入有效的URL地址');
    });
  });

  describe('validateDate', () => {
    it('should accept valid dates', () => {
      expect(validateDate('2024-01-01')).toBeNull();
      expect(validateDate('2024-12-31')).toBeNull();
      expect(validateDate('2000-06-15')).toBeNull();
    });

    it('should reject invalid dates', () => {
      expect(validateDate('')).toBe('请输入有效的日期');
      expect(validateDate('invalid')).toBe('请输入有效的日期');
      expect(validateDate('2024-13-01')).toBe('请输入有效的日期');
      expect(validateDate('2024-02-30')).toBe('请输入有效的日期');
    });

    it('should reject past dates when specified', () => {
      const today = new Date().toISOString().split('T')[0];
      expect(validateDate('2020-01-01', { allowPast: false })).toBe('日期不能是过去的时间');
    });

    it('should accept future dates when allowPast is false', () => {
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      expect(validateDate(futureDateStr, { allowPast: false })).toBeNull();
    });
  });
});
