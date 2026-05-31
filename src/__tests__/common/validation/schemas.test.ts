import {
  EmailSchema,
  PasswordSchema,
  UsernameSchema,
  TagSchema,
  MoodSchema,
  DateStringSchema,
  CreateRecordSchema,
  CreateGoalSchema,
  CreateReminderSchema,
  RegisterSchema,
  LoginSchema
} from '../../../common/validation/schemas';

describe('Validation Schemas', () => {
  describe('EmailSchema', () => {
    test('should validate correct email', () => {
      const result = EmailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    test('should normalize email to lowercase', () => {
      const result = EmailSchema.safeParse('TEST@EXAMPLE.COM');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('test@example.com');
      }
    });

    test('should reject invalid email', () => {
      const result = EmailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    test('should reject empty email', () => {
      const result = EmailSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    test('should reject email without @', () => {
      const result = EmailSchema.safeParse('testexample.com');
      expect(result.success).toBe(false);
    });

    test('should reject email without domain', () => {
      const result = EmailSchema.safeParse('test@');
      expect(result.success).toBe(false);
    });
  });

  describe('PasswordSchema', () => {
    test('should validate correct password', () => {
      const result = PasswordSchema.safeParse('Password123');
      expect(result.success).toBe(true);
    });

    test('should reject short password', () => {
      const result = PasswordSchema.safeParse('Pass1');
      expect(result.success).toBe(false);
    });

    test('should reject password without uppercase', () => {
      const result = PasswordSchema.safeParse('password123');
      expect(result.success).toBe(false);
    });

    test('should reject password without lowercase', () => {
      const result = PasswordSchema.safeParse('PASSWORD123');
      expect(result.success).toBe(false);
    });

    test('should reject password without number', () => {
      const result = PasswordSchema.safeParse('Passwordabc');
      expect(result.success).toBe(false);
    });

    test('should reject password that is too long', () => {
      const result = PasswordSchema.safeParse('A'.repeat(129) + '12345678');
      expect(result.success).toBe(false);
    });
  });

  describe('UsernameSchema', () => {
    test('should validate correct username', () => {
      const result = UsernameSchema.safeParse('john_doe123');
      expect(result.success).toBe(true);
    });

    test('should validate Chinese username', () => {
      const result = UsernameSchema.safeParse('张三');
      expect(result.success).toBe(true);
    });

    test('should reject username that is too short', () => {
      const result = UsernameSchema.safeParse('a');
      expect(result.success).toBe(false);
    });

    test('should reject username that is too long', () => {
      const result = UsernameSchema.safeParse('a'.repeat(51));
      expect(result.success).toBe(false);
    });

    test('should reject username with invalid characters', () => {
      const result = UsernameSchema.safeParse('john@doe');
      expect(result.success).toBe(false);
    });
  });

  describe('TagSchema', () => {
    test('should validate correct tag', () => {
      const result = TagSchema.safeParse('javascript');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('javascript');
      }
    });

    test('should normalize tag to lowercase', () => {
      const result = TagSchema.safeParse('JAVASCRIPT');
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe('javascript');
      }
    });

    test('should reject empty tag', () => {
      const result = TagSchema.safeParse('');
      expect(result.success).toBe(false);
    });

    test('should reject tag that is too long', () => {
      const result = TagSchema.safeParse('a'.repeat(51));
      expect(result.success).toBe(false);
    });

    test('should accept tag with hash symbol', () => {
      const result = TagSchema.safeParse('#tag');
      expect(result.success).toBe(true);
    });

    test('should accept tag with hyphen', () => {
      const result = TagSchema.safeParse('web-development');
      expect(result.success).toBe(true);
    });
  });

  describe('MoodSchema', () => {
    test('should validate great mood', () => {
      const result = MoodSchema.safeParse('great');
      expect(result.success).toBe(true);
    });

    test('should validate okay mood', () => {
      const result = MoodSchema.safeParse('okay');
      expect(result.success).toBe(true);
    });

    test('should validate not_good mood', () => {
      const result = MoodSchema.safeParse('not_good');
      expect(result.success).toBe(true);
    });

    test('should reject invalid mood', () => {
      const result = MoodSchema.safeParse('excellent');
      expect(result.success).toBe(false);
    });
  });

  describe('DateStringSchema', () => {
    test('should validate correct date format', () => {
      const result = DateStringSchema.safeParse('2024-01-15');
      expect(result.success).toBe(true);
    });

    test('should reject invalid date format', () => {
      const result = DateStringSchema.safeParse('01-15-2024');
      expect(result.success).toBe(false);
    });

    test('should reject invalid date', () => {
      const result = DateStringSchema.safeParse('2024-13-45');
      expect(result.success).toBe(false);
    });

    test('should reject non-date string', () => {
      const result = DateStringSchema.safeParse('not-a-date');
      expect(result.success).toBe(false);
    });
  });

  describe('CreateRecordSchema', () => {
    test('should validate correct record', () => {
      const result = CreateRecordSchema.safeParse({
        activity: 'Learned React hooks',
        learning: 'useEffect and useState',
        mood: 'great',
        reflection: 'Great progress',
        tags: ['react', 'javascript']
      });
      expect(result.success).toBe(true);
    });

    test('should accept minimal record', () => {
      const result = CreateRecordSchema.safeParse({
        mood: 'okay'
      });
      expect(result.success).toBe(true);
    });

    test('should reject invalid mood', () => {
      const result = CreateRecordSchema.safeParse({
        mood: 'excellent'
      });
      expect(result.success).toBe(false);
    });

    test('should cap tags at 20', () => {
      const result = CreateRecordSchema.safeParse({
        mood: 'great',
        tags: Array(21).fill('tag')
      });
      expect(result.success).toBe(false);
    });

    test('should default tags to empty array', () => {
      const result = CreateRecordSchema.safeParse({
        mood: 'great'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.tags).toEqual([]);
      }
    });
  });

  describe('CreateGoalSchema', () => {
    test('should validate correct goal', () => {
      const result = CreateGoalSchema.safeParse({
        title: 'Learn TypeScript',
        description: 'Master TypeScript in 3 months',
        targetDate: '2024-12-31',
        status: 'active',
        priority: 'high',
        progress: 0
      });
      expect(result.success).toBe(true);
    });

    test('should require title', () => {
      const result = CreateGoalSchema.safeParse({
        description: 'Test description'
      });
      expect(result.success).toBe(false);
    });

    test('should default status to active', () => {
      const result = CreateGoalSchema.safeParse({
        title: 'Test Goal'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.status).toBe('active');
      }
    });

    test('should default priority to medium', () => {
      const result = CreateGoalSchema.safeParse({
        title: 'Test Goal'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priority).toBe('medium');
      }
    });

    test('should reject invalid status', () => {
      const result = CreateGoalSchema.safeParse({
        title: 'Test Goal',
        status: 'invalid'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('CreateReminderSchema', () => {
    test('should validate correct reminder', () => {
      const result = CreateReminderSchema.safeParse({
        title: 'Daily standup',
        description: 'Team meeting',
        time: '2024-01-15T09:00:00Z',
        repeat: 'daily',
        enabled: true
      });
      expect(result.success).toBe(true);
    });

    test('should require title', () => {
      const result = CreateReminderSchema.safeParse({
        time: '2024-01-15T09:00:00Z'
      });
      expect(result.success).toBe(false);
    });

    test('should require valid time', () => {
      const result = CreateReminderSchema.safeParse({
        title: 'Test',
        time: 'invalid-time'
      });
      expect(result.success).toBe(false);
    });

    test('should default repeat to none', () => {
      const result = CreateReminderSchema.safeParse({
        title: 'Test',
        time: '2024-01-15T09:00:00Z'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.repeat).toBe('none');
      }
    });

    test('should default enabled to true', () => {
      const result = CreateReminderSchema.safeParse({
        title: 'Test',
        time: '2024-01-15T09:00:00Z'
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.enabled).toBe(true);
      }
    });
  });

  describe('RegisterSchema', () => {
    test('should validate correct registration', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123'
      });
      expect(result.success).toBe(true);
    });

    test('should accept registration without name', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'Password123'
      });
      expect(result.success).toBe(true);
    });

    test('should reject invalid email', () => {
      const result = RegisterSchema.safeParse({
        email: 'invalid-email',
        password: 'Password123'
      });
      expect(result.success).toBe(false);
    });

    test('should reject weak password', () => {
      const result = RegisterSchema.safeParse({
        email: 'test@example.com',
        password: 'weak'
      });
      expect(result.success).toBe(false);
    });
  });

  describe('LoginSchema', () => {
    test('should validate correct login', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword'
      });
      expect(result.success).toBe(true);
    });

    test('should reject empty password', () => {
      const result = LoginSchema.safeParse({
        email: 'test@example.com',
        password: ''
      });
      expect(result.success).toBe(false);
    });

    test('should reject invalid email', () => {
      const result = LoginSchema.safeParse({
        email: 'invalid-email',
        password: 'password123'
      });
      expect(result.success).toBe(false);
    });
  });
});
