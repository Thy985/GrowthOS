import { z } from 'zod';

export const EmailSchema = z
  .string()
  .min(1, '邮箱不能为空')
  .email('请输入有效的邮箱地址')
  .max(255, '邮箱长度不能超过255个字符')
  .transform(val => val.toLowerCase().trim());

export const PasswordSchema = z
  .string()
  .min(8, '密码至少需要8个字符')
  .max(128, '密码长度不能超过128个字符')
  .regex(/[A-Z]/, '密码必须包含至少一个大写字母')
  .regex(/[a-z]/, '密码必须包含至少一个小写字母')
  .regex(/[0-9]/, '密码必须包含至少一个数字');

export const UsernameSchema = z
  .string()
  .min(2, '用户名至少需要2个字符')
  .max(50, '用户名不能超过50个字符')
  .regex(/^[a-zA-Z0-9_\u4e00-\u9fa5]+$/, '用户名只能包含字母、数字、下划线和中文');

export const RecordActivitySchema = z
  .string()
  .max(1000, '活动内容不能超过1000个字符')
  .transform(val => val.trim());

export const RecordLearningSchema = z
  .string()
  .max(2000, '学习内容不能超过2000个字符')
  .transform(val => val.trim());

export const RecordReflectionSchema = z
  .string()
  .max(5000, '反思内容不能超过5000个字符')
  .transform(val => val.trim());

export const TagSchema = z
  .string()
  .min(1, '标签不能为空')
  .max(50, '标签不能超过50个字符')
  .regex(/^[a-zA-Z0-9_\-#]+$/, '标签只能包含字母、数字、下划线、连字符和#')
  .transform(val => val.toLowerCase().trim());

export const MoodSchema = z.enum(['great', 'okay', 'not_good']);

export const GoalTitleSchema = z
  .string()
  .min(1, '目标标题不能为空')
  .max(200, '目标标题不能超过200个字符')
  .transform(val => val.trim());

export const GoalDescriptionSchema = z
  .string()
  .max(5000, '目标描述不能超过5000个字符')
  .transform(val => val.trim());

export const ReminderTitleSchema = z
  .string()
  .min(1, '提醒标题不能为空')
  .max(200, '提醒标题不能超过200个字符')
  .transform(val => val.trim());

export const ReminderTimeSchema = z
  .string()
  .refine(val => !isNaN(Date.parse(val)), {
    message: '请输入有效的日期时间'
  });

export const DateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, '日期格式必须为 YYYY-MM-DD')
  .refine(val => !isNaN(Date.parse(val)), {
    message: '请输入有效的日期'
  });

export const CreateRecordSchema = z.object({
  activity: RecordActivitySchema.optional(),
  learning: RecordLearningSchema.optional(),
  mood: MoodSchema,
  reflection: RecordReflectionSchema.optional(),
  tags: z.array(TagSchema).max(20, '最多只能添加20个标签').default([]),
  date: DateStringSchema.optional()
});

export const UpdateRecordSchema = CreateRecordSchema.partial();

export const CreateGoalSchema = z.object({
  title: GoalTitleSchema,
  description: GoalDescriptionSchema.optional(),
  targetDate: DateStringSchema.optional(),
  status: z.enum(['active', 'completed', 'paused', 'cancelled']).default('active'),
  priority: z.enum(['low', 'medium', 'high']).default('medium'),
  progress: z.number().min(0).max(100).default(0)
});

export const UpdateGoalSchema = CreateGoalSchema.partial();

export const CreateReminderSchema = z.object({
  title: ReminderTitleSchema,
  description: z.string().max(1000).optional(),
  time: ReminderTimeSchema,
  repeat: z.enum(['none', 'daily', 'weekly', 'monthly']).default('none'),
  enabled: z.boolean().default(true)
});

export const UpdateReminderSchema = CreateReminderSchema.partial();

export const RegisterSchema = z.object({
  email: EmailSchema,
  password: PasswordSchema,
  name: UsernameSchema.optional()
});

export const LoginSchema = z.object({
  email: EmailSchema,
  password: z.string().min(1, '密码不能为空')
});

export type ValidatedEmail = z.infer<typeof EmailSchema>;
export type ValidatedPassword = z.infer<typeof PasswordSchema>;
export type ValidatedUsername = z.infer<typeof UsernameSchema>;
export type ValidatedTag = z.infer<typeof TagSchema>;
export type ValidatedMood = z.infer<typeof MoodSchema>;
export type ValidatedDate = z.infer<typeof DateStringSchema>;
export type CreateRecordInput = z.infer<typeof CreateRecordSchema>;
export type UpdateRecordInput = z.infer<typeof UpdateRecordSchema>;
export type CreateGoalInput = z.infer<typeof CreateGoalSchema>;
export type UpdateGoalInput = z.infer<typeof UpdateGoalSchema>;
export type CreateReminderInput = z.infer<typeof CreateReminderSchema>;
export type UpdateReminderInput = z.infer<typeof UpdateReminderSchema>;
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;
