// ID 类型别名 - 统一使用 string
export type ID = string;

// 情绪类型
export type Mood = '很好' | '一般' | '不太好';

// 目标状态
export type GoalStatus = 'active' | 'completed' | 'cancelled';

// 记录类型
export interface Record {
  id: ID;
  date?: string;
  activity: string;
  learning: string;
  reflection: string;
  mood: Mood;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

// 标签类型
export type Tag = string;

// 技能树节点类型
export interface TreeNode {
  id: ID;
  treeId: ID;
  parentId: ID | null;
  name: string;
  type: 'skill' | 'habit' | 'knowledge';
  mastery: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startDate?: string;
  createdAt: string;
  updatedAt?: string;
}

// 技能树
export interface Tree {
  id: ID;
  userId?: ID;
  name: string;
  createdAt: string;
  updatedAt?: string;
  children?: TreeNode[];
}

// 用户类型
export interface User {
  id: ID;
  email: string;
  name?: string;
  createdAt: string;
}

// 认证状态类型
export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 主题状态类型
export interface ThemeState {
  isDarkMode: boolean;
}

// 成长状态类型
export interface GrowthState {
  records: Record[];
  tags: Tag[];
  trees: Tree[];
  isLoading: boolean;
  error: string | null;
}

// 目标类型
export interface Goal {
  id: ID;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: GoalStatus;
  createdAt: string;
  updatedAt?: string;
}

// 目标状态类型
export interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
}

// 提醒类型
export interface Reminder {
  id: ID;
  title: string;
  description: string;
  date: string;
  time: string;
  goalId?: ID;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}

// 提醒状态类型
export interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
}

// 根状态类型
export interface RootState {
  auth: AuthState;
  growth: GrowthState;
  theme: ThemeState;
  goal: GoalState;
  reminder: ReminderState;
}

// 服务层 DTO 类型
export interface CreateRecordDTO {
  date?: string;
  activity?: string;
  learning?: string;
  reflection?: string;
  mood?: Mood;
  tags?: string[];
}

export interface CreateGoalDTO {
  title: string;
  description?: string;
  targetValue: number;
  startDate: string;
  endDate: string;
}

export interface UpdateGoalDTO {
  title?: string;
  description?: string;
  targetValue?: number;
  currentValue?: number;
  status?: GoalStatus;
}

export interface CreateReminderDTO {
  title: string;
  description?: string;
  date: string;
  time: string;
  goalId?: ID;
}

export interface UpdateReminderDTO {
  title?: string;
  description?: string;
  date?: string;
  time?: string;
  isCompleted?: boolean;
}

// 徽章类型
export interface Badge {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: (stats: BadgeStats) => boolean;
}

export interface BadgeStats {
  totalRecords: number;
  streak: number;
  weeklyRecords: number;
  weeklyChangePercent: number;
}

// 统计类型
export interface DashboardStats {
  weeklyRecords: number;
  totalRecords: number;
  streak: number;
  growthProgress: number;
  weekChange: number;
  weekChangePercent: number;
  moodStats: { [key in Mood]: number };
}

// 错误类型
export interface AppError {
  code: string;
  message: string;
  details?: unknown;
}
