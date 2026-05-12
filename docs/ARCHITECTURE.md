# GrowthOS 架构设计文档

## 1. 架构概述

GrowthOS 采用**纯前端 + 本地存储**的架构设计，无需后端服务，数据直接存储在用户设备上。

### 1.1 设计原则

| 原则 | 描述 |
|------|------|
| 本地优先 | 数据存储在本地，保护用户隐私 |
| 无网络依赖 | 所有功能离线可用 |
| 跨平台统一 | Web、iOS、Android 使用同一代码库 |
| 类型安全 | TypeScript 严格模式保证类型安全 |

### 1.2 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      GrowthOS 应用层                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │  页面组件  │  │  通用组件  │  │  图表组件  │  │  AI 组件  │   │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘   │
│        │             │             │             │         │
│        └─────────────┴─────────────┴─────────────┘         │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────────┐   │
│  │                     Context 层                       │   │
│  │  ┌─────────────┐ ┌─────────────┐ ┌─────────────┐    │   │
│  │  │ AuthContext │ │GrowthContext│ │ThemeContext │    │   │
│  │  └─────────────┘ └─────────────┘ └─────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────────┐   │
│  │                   Redux Store 层                    │   │
│  │  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐     │   │
│  │  │  auth  │ │ growth │ │  goal  │ │reminder│     │   │
│  │  └────────┘ └────────┘ └────────┘ └────────┘     │   │
│  └──────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────────┐   │
│  │                   Service 层 (V2)                   │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │ auth     │ │ record   │ │   goal   │           │   │
│  │  │ Service  │ │ Service  │ │ Service  │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘           │   │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐           │   │
│  │  │  tree    │ │reminder  │ │   db    │           │   │
│  │  │ Service  │ │ Service  │ │ Service │           │   │
│  │  └──────────┘ └──────────┘ └──────────┘           │   │
│  └──────────────────────────────────────────────────────┘   │
│                           │                                  │
│  ┌────────────────────────┼────────────────────────────┐   │
│  │                   Storage 层                         │   │
│  │  ┌────────────────┐  ┌────────────────┐             │   │
│  │  │  LocalStorage │  │    SQLite     │             │   │
│  │  │   (Web)        │  │  (Capacitor)   │             │   │
│  │  └────────────────┘  └────────────────┘             │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. 技术架构

### 2.1 技术栈概览

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 18.2 | UI 框架 |
| 语言 | TypeScript | 5.3 | 类型安全 |
| 构建 | Vite | 5.0 | 快速构建 |
| 状态管理 | Redux Toolkit | 2.11 | 全局状态 |
| 路由 | React Router | 6.22 | 页面路由 |
| 样式 | Tailwind CSS | 3.4 | 样式方案 |
| 可视化 | ReactFlow | 11.8 | 技能树渲染 |
| 图表 | Recharts | 2.10 | 数据可视化 |
| 移动 | Capacitor | 8.3 | 跨平台打包 |
| 数据库 | SQLite | - | 本地持久化 |
| 国际化 | i18next | 26.0 | 多语言支持 |

### 2.2 架构分层

```
┌─────────────────────────────────────────┐
│           Presentation Layer            │  页面/组件
├─────────────────────────────────────────┤
│            State Management             │  Redux/Context
├─────────────────────────────────────────┤
│             Service Layer               │  业务逻辑
├─────────────────────────────────────────┤
│           Repository Layer              │  数据访问
├─────────────────────────────────────────┤
│          Storage Layer                  │  持久化
└─────────────────────────────────────────┘
```

---

## 3. 目录结构

```
src/
├── common/                    # 公共模块
│   └── services/             # 服务层
│       ├── authServiceV2.ts  # 认证服务
│       ├── recordServiceV2.ts # 记录服务
│       ├── goalServiceV2.ts  # 目标服务
│       ├── growthTreeServiceV2.ts # 技能树服务
│       ├── reminderServiceV2.ts   # 提醒服务
│       └── dbService.ts      # 数据库服务
├── components/                # React 组件
│   ├── common/               # 通用组件
│   │   ├── Button.tsx
│   │   ├── Card.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   └── growth-tree/         # 技能树组件
│       ├── TreeVisualization.tsx
│       ├── NodeDetails.tsx
│       ├── AIGardener.tsx
│       └── index.ts
├── constants/                # 常量定义
│   └── index.ts
├── contexts/                 # React Context
│   ├── AuthContext.tsx
│   ├── GrowthContext.tsx
│   └── ThemeContext.tsx
├── hooks/                    # 自定义 Hooks
│   └── useKeyboardShortcuts.ts
├── i18n/                     # 国际化
│   ├── index.ts
│   ├── zh-CN.json
│   └── en-US.json
├── pages/                    # 页面组件
│   ├── Home.tsx
│   ├── dashboard/
│   ├── records/
│   ├── goals/
│   ├── growth-tree/
│   ├── reminders/
│   ├── analytics/
│   └── auth/
├── store/                    # Redux Store
│   ├── index.ts
│   └── slices/
│       ├── authSlice.ts
│       ├── growthSlice.ts
│       ├── goalSlice.ts
│       ├── reminderSlice.ts
│       └── themeSlice.ts
├── types/                    # 类型定义
│   └── index.ts
└── utils/                    # 工具函数
    ├── errorHandler.ts
    ├── secureStorage.js
    ├── encryption.js
    └── logger.js
```

---

## 4. 服务层设计

### 4.1 服务层职责

| 服务 | 职责 |
|------|------|
| authServiceV2 | 用户认证、密码管理 |
| recordServiceV2 | 每日记录 CRUD |
| goalServiceV2 | 目标管理 CRUD |
| growthTreeServiceV2 | 技能树和节点管理 |
| reminderServiceV2 | 提醒管理 CRUD |
| dbService | 数据库初始化和迁移 |

### 4.2 服务接口设计

```typescript
// 统一的 DTO 模式
interface CreateDTO { /* 创建参数 */ }
interface UpdateDTO { /* 更新参数 */ }
interface Entity { /* 实体类型 */ }

// 统一的服务接口
interface Service {
  create(dto: CreateDTO): Promise<Entity>;
  update(id: ID, dto: UpdateDTO): Promise<Entity>;
  delete(id: ID): Promise<void>;
  getById(id: ID): Promise<Entity | null>;
  getAll(): Promise<Entity[]>;
}
```

### 4.3 服务层原则

| 原则 | 描述 |
|------|------|
| 单一职责 | 每个服务只负责一个领域 |
| 无状态 | 服务不维护状态，数据存储在 Storage 层 |
| 类型安全 | 所有输入输出都有类型定义 |
| 错误处理 | 统一的错误处理机制 |

---

## 5. 状态管理

### 5.1 Redux Store 结构

```typescript
interface RootState {
  auth: {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    error: string | null;
  };
  growth: {
    records: Record[];
    tags: Tag[];
    trees: Tree[];
    isLoading: boolean;
    error: string | null;
  };
  goal: {
    goals: Goal[];
    isLoading: boolean;
    error: string | null;
  };
  reminder: {
    reminders: Reminder[];
    isLoading: boolean;
    error: string | null;
  };
  theme: {
    isDarkMode: boolean;
  };
}
```

### 5.2 数据流

```
用户操作 → Dispatch Action → Reducer → 更新 State → 组件重新渲染
                    ↓
              AsyncThunk
                    ↓
              Service Layer
                    ↓
              Storage Layer
```

### 5.3 Context 使用场景

| Context | 用途 |
|---------|------|
| AuthContext | 认证状态和用户信息 |
| GrowthContext | 技能树相关上下文 |
| ThemeContext | 主题切换 |

---

## 6. 存储架构

### 6.1 存储策略

| 平台 | 存储方式 | 说明 |
|------|----------|------|
| Web | LocalStorage | 浏览器本地存储 |
| Mobile | SQLite | 原生数据库 |

### 6.2 存储键设计

```typescript
const STORAGE_KEYS = {
  RECORDS: 'growth-records',
  TAGS: 'growth-tags',
  TREES: 'growth-trees',
  GOALS: 'growth-goals',
  REMINDERS: 'growth-reminders',
  USER: 'auth-user',
  USERS: 'auth-users',
  THEME: 'app-theme',
  SETTINGS: 'app-settings'
};
```

### 6.3 数据模型

详见 [DATABASE.md](./DATABASE.md)

---

## 7. 组件设计

### 7.1 组件分类

| 分类 | 说明 | 示例 |
|------|------|------|
| 页面组件 | 对应路由的页面 | Dashboard, Goals |
| 容器组件 | 连接 Redux/Context | RecordList |
| 展示组件 | 纯 UI 组件 | Button, Card |
| 布局组件 | 页面布局 | Header, Sidebar |

### 7.2 组件通信

```
Props → 父组件向子组件传递数据
Context → 跨层级数据共享
Redux → 全局状态管理
Callback → 子组件向父组件传递事件
```

---

## 8. 路由设计

### 8.1 路由结构

```typescript
const routes = [
  { path: '/login', component: Login },
  { path: '/register', component: Register },
  { path: '/', component: Home, children: [
    { path: 'dashboard', component: Dashboard },
    { path: 'records', component: Records },
    { path: 'goals', component: Goals },
    { path: 'growth-tree', component: GrowthTree },
    { path: 'reminders', component: Reminders },
    { path: 'analytics', component: Analytics },
  ]}
];
```

### 8.2 路由守卫

- `/login` 和 `/register`：未认证用户可访问
- 其他页面：需要认证

---

## 9. 安全设计

### 9.1 密码安全

| 措施 | 说明 |
|------|------|
| 哈希算法 | SHA-256 |
| 加盐 | 使用随机盐值 |
| 前端处理 | Web Crypto API |

### 9.2 数据安全

| 措施 | 说明 |
|------|------|
| 本地加密 | CryptoJS AES |
| 存储隔离 | 按用户分开存储 |
| 会话管理 | 自动过期机制 |

---

## 10. 错误处理

### 10.1 错误类型

```typescript
class ValidationError extends Error { field?: string; }
class StorageError extends Error { originalError?: Error; }
class AuthenticationError extends Error { }
class NotFoundError extends Error { }
```

### 10.2 错误处理流程

```
捕获错误 → 判断类型 → 记录日志 → 用户提示
                              ↓
                        ErrorBoundary
```

---

## 11. 性能优化

### 11.1 优化策略

| 策略 | 实现 |
|------|------|
| 代码分割 | React.lazy + Suspense |
| 懒加载 | 路由懒加载 |
| 缓存 | React.memo |
| 虚拟化 | react-window（长列表） |

### 11.2 构建优化

| 优化项 | 配置 |
|--------|------|
| Tree Shaking | Vite 默认支持 |
| 压缩 | terser |
| 分包 | dynamic import |
| CDN | 公共库 external |

---

## 12. 测试策略

### 12.1 测试类型

| 类型 | 工具 | 覆盖范围 |
|------|------|----------|
| 单元测试 | Jest | Services, Utils |
| 组件测试 | React Testing Library | Components |
| 集成测试 | Jest + Testing Library | Pages |

### 12.2 测试覆盖率目标

- Services: 80%+
- Utils: 80%+
- Components: 60%+

---

## 13. 部署架构

### 13.1 Web 部署

```
Build → Dist → CDN/Static Hosting
```

### 13.2 移动端部署

```
Build → Capacitor Sync → Native Build → App Store
```

---

## 14. 扩展性设计

### 14.1 插件系统

未来可通过 Context 注入扩展功能：
- 插件注册表
- 生命周期钩子
- 配置管理

### 14.2 云端同步预留

```typescript
interface SyncProvider {
  sync(): Promise<void>;
  resolveConflict(local: Entity, remote: Entity): Entity;
}
```

---

## 15. 修订历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2026-05-12 | 初始版本 |
