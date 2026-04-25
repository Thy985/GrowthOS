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

// 成长状态类型
export interface GrowthState {
  records: Record[];
  tags: Tag[];
  trees: Tree[];
  isLoading: boolean;
  error: string | null;
}

// 根状态类型
export interface RootState {
  auth: AuthState;
  growth: GrowthState;
  theme: ThemeState;
}
