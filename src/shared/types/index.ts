// 记录类型
export interface Record {
  id: string;
  activity: string;
  learning: string;
  reflection: string;
  mood: '很好' | '一般' | '不太好';
  tags: string[];
  createdAt: string;
}

// 标签类型
export type Tag = string;

// 技能树节点类型
export interface Tree {
  id: string;
  name: string;
  parentId: string | null;
  description: string;
  icon: string;
  progress: number;
  createdAt: string;
  updatedAt: string;
  children: Tree[];
}

// 认证状态类型
export interface AuthState {
  user: {
    id: string;
    username: string;
    email: string;
  } | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// 主题状态类型
export interface ThemeState {
  isDarkMode: boolean;
}

// 成长状态类型(阶段 E 后,实际只保留 orchestration isLoading/error)
export interface GrowthState {
  isLoading: boolean;
  error: string | null;
}

// 记录状态类型
export interface RecordsState {
  records: Record[];
  tags: Tag[];
  isLoading: boolean;
  error: string | null;
}

// 技能树状态类型
export interface TreeState {
  trees: Tree[];
  isLoading: boolean;
  error: string | null;
}

// 目标类型
export interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}

// 目标状态类型
export interface GoalState {
  goals: Goal[];
  isLoading: boolean;
  error: string | null;
}

// 提醒类型
export interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  goalId?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// 提醒状态类型
export interface ReminderState {
  reminders: Reminder[];
  isLoading: boolean;
  error: string | null;
}

// ============ 经验管理系统新类型 ============

// 经历类型（结构化反思模板）
export interface Experience {
  id: string;
  userId: string;
  event: string; // 客观事件
  reflection?: string; // 主观反思
  principle?: string; // 抽象原则
  confidence: number; // 确信度 0-1
  projectId?: string; // 关联项目
  mood?: number; // 情绪 -10 ~ +10
  energy?: number; // 能量 0-10
  occurredAt: string;
  createdAt: string;
  updatedAt: string;
}

// 能力类型
export interface Capability {
  id: string;
  userId: string;
  name: string;
  category: CapabilityCategory;
  parentId: string | null; // 父能力（支持树形）
  currentLevel: number; // 当前水平 0-100
  targetLevel: number; // 目标水平 0-100
  growthRate: number; // 增长率
  description?: string;
  icon?: string;
  color?: string;
  lastUpdated: string;
  createdAt: string;
}

export type CapabilityCategory = 'mind' | 'skill' | 'cognition' | 'body' | 'social';

// 经历-能力关联
export interface ExperienceCapabilityLink {
  id: string;
  experienceId: string;
  capabilityId: string;
  contribution: number; // 贡献度 0-1
  evidence?: string; // 证据
}

// 能力历史记录（成长曲线）
export interface CapabilityHistory {
  id: string;
  capabilityId: string;
  level: number;
  recordedAt: string;
  triggerExperienceId?: string;
}

// 原则类型
export interface Principle {
  id: string;
  userId: string;
  content: string;
  sourceExperienceIds: string[]; // 来源经历 ID 列表
  category?: string;
  confidence: number; // 确信度 0-1
  usageCount: number; // 使用次数
  lastUsedAt?: string;
  createdAt: string;
}

// 项目类型
export interface Project {
  id: string;
  userId: string;
  name: string;
  description?: string;
  status: 'active' | 'completed' | 'paused' | 'abandoned';
  startDate?: string;
  endDate?: string;
  capabilitiesUsed?: string[]; // 涉及的能力 ID 列表
  experienceGained?: string[]; // 提炼的经验 ID 列表
  retrospective?: {
    whatWentWell: string[];
    whatWentWrong: string[];
    nextTime: string[];
  };
  createdAt: string;
  updatedAt: string;
}

// ============ Redux State 类型 ============

// 经历状态类型
export interface ExperiencesState {
  experiences: Experience[];
  links: ExperienceCapabilityLink[];
  isLoading: boolean;
  error: string | null;
}

// 能力状态类型
export interface CapabilitiesState {
  capabilities: Capability[];
  history: CapabilityHistory[];
  isLoading: boolean;
  error: string | null;
}

// 原则状态类型
export interface PrinciplesState {
  principles: Principle[];
  isLoading: boolean;
  error: string | null;
}

// 项目状态类型
export interface ProjectsState {
  projects: Project[];
  isLoading: boolean;
  error: string | null;
}

// Coach state placeholder (actual type lives in features/coach)
export interface CoachState {
  diagnosis: unknown;
  history: unknown[];
  lastAnalyzedAt: string | null;
  isAnalyzing: boolean;
  recommendationStatuses: unknown;
}

// 根状态类型
export interface RootState {
  auth: AuthState;
  growth: GrowthState;
  records: RecordsState;
  tree: TreeState;
  theme: ThemeState;
  goal: GoalState;
  reminder: ReminderState;
  experiences: ExperiencesState;
  capabilities: CapabilitiesState;
  principles: PrinciplesState;
  projects: ProjectsState;
  coach: CoachState;
}
