# GrowthOS 架构设计文档

> 状态：v2.0 · 最近更新 2026-06-04 · 反映 IndexedDB 主导 + 装饰器栈 + 跨切关注点 + 数据保护 + 新 CI/CD

---

## 0. 重大变更摘要（相对 v1.0）

| 维度 | v1.0（旧） | v2.0（当前） |
|------|-----------|-------------|
| 主存储 | LocalStorage | **IndexedDB**（通过 `idb` 库） |
| 业务服务 | 直接读写 `localStorage` | 通过 `Repository` 抽象 + 装饰器栈（Caching / Synced / Quota） |
| Backend 切换 | 硬编码 | 运行时可切 IndexedDB / LocalStorage / In-Memory，切换时**自动迁移** |
| 数据保护 | 无 | 全量备份/恢复（`BackupData` schema v2），含偏好与凭证 |
| 装饰器 | 无 | `CachingRepository` + `SyncedRepository`（跨 tab BroadcastChannel）+ `QuotaMonitor` |
| 跨切关注点 | 散落 | 集中在 `storage/{migrator,backup,sync,quota}/` 子模块 |
| 类型安全 | 局部 | `StorageAdapter` 抽象 + `BaseEntity` ID 类型 + discriminated errors |
| CI/CD | 基础 | 5 个 workflow，缓存 + 并发控制 + Codecov + GitHub Pages |
| 测试 | 34 suites | 34 suites，**499 测试**，含 IDB 迁移、备份、UI 集成 |

---

## 1. 架构概述

GrowthOS 采用**纯前端 + 本地存储**的架构设计，无需后端服务。数据保存在用户设备，
业务逻辑通过**装饰器栈**与**StorageAdapter 抽象**层与具体存储解耦。

### 1.1 设计原则

| 原则 | 描述 |
|------|------|
| 本地优先 | 数据存储在本地，保护用户隐私 |
| 无网络依赖 | 所有功能离线可用 |
| 抽象与具体解耦 | 业务代码不直接接触 IDB/LS，依赖 `Repository<T>` 接口 |
| 装饰器优于继承 | 横切关注点（缓存、同步、配额、迁移）通过装饰器组合 |
| 跨切关注点集中 | 迁移 / 备份 / 同步 / 配额监控独立成模块 |
| 数据保护先行 | 全量备份恢复 + merge/overwrite 模式 + 偏好/凭证独立开关 |
| 类型安全 | TypeScript 严格模式 + `BaseEntity` discriminated types |

### 1.2 顶层架构

```
┌──────────────────────────────────────────────────────────────┐
│                       GrowthOS 应用层                          │
├──────────────────────────────────────────────────────────────┤
│  Pages (React) ─→ Hooks ─→ Redux Toolkit Slices              │
│                                  │                            │
│  StorageSettings, Dashboard, …   │                            │
├──────────────────────────────────┼────────────────────────────┤
│  Service V2 (auth/record/goal/  │  业务编排                   │
│  growthTree/reminder/chat)      │                            │
│  ─→ 使用 Repository<T> 抽象     │                            │
├──────────────────────────────────┼────────────────────────────┤
│  Repository Decorator Stack     │  数据访问                   │
│  ┌────────────────────────────┐ │                            │
│  │ SyncedRepository           │ │  ← 跨 tab BroadcastChannel │
│  │       ↓                    │ │                            │
│  │ CachingRepository          │ │  ← 读穿透 + 失效广播        │
│  │       ↓                    │ │                            │
│  │ BaseRepository<T>          │ │  ← 委托给 StorageAdapter   │
│  └────────┬───────────────────┘ │                            │
├───────────┼─────────────────────────────────────────────────┤
│  StorageAdapter (可热插拔)     │                              │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐             │
│  │IndexedDB   │  │LocalStorage│  │InMemory    │             │
│  │(idb lib)   │  │(legacy)    │  │(test/debug)│             │
│  └────────────┘  └────────────┘  └────────────┘             │
├──────────────────────────────────────────────────────────────┤
│  Cross-cutting modules (storage/)                            │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐        │
│  │ migrator │ │ backup   │ │ sync     │ │ quota    │        │
│  │(backend  │ │(JSON     │ │(BcastChan│ │(estimate │        │
│  │ 切换)    │ │ 导入导出)│ │ 同步)    │ │ + 预警)  │        │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘        │
└──────────────────────────────────────────────────────────────┘
```

---

## 2. 技术栈

| 层级 | 技术 | 版本 | 用途 |
|------|------|------|------|
| 框架 | React | 18.2 | UI 框架 |
| 语言 | TypeScript | 5.3 | 严格模式 + `BaseEntity` 泛型 |
| 构建 | Vite | 5.0 | 快速构建 + ESM HMR |
| 状态 | Redux Toolkit | 2.11 | 全局状态，async thunks 调用 Service V2 |
| 路由 | React Router | 6.22 | HashRouter（GitHub Pages 友好） |
| 样式 | Tailwind CSS | 3.4 | 主题变量驱动的设计 token |
| 存储 | idb | 8 | IndexedDB Promise 包装 |
| 可视化 | ReactFlow | 11.8 | 技能树渲染 |
| 图表 | Recharts | 2.10 | 仪表盘图表 |
| 移动 | Capacitor | 8.3 | 跨平台打包（Native SQLite 是后续选项） |
| 国际化 | i18next + react-i18next | 26.0 | 多语言（zh-CN / en-US 270+ keys） |
| 测试 | Jest + @testing-library + fake-indexeddb | 29 | 499 测试，含 IDB polyfill |
| E2E | Playwright | 1.x | TypeScript E2E（`e2e/app.spec.ts`） |
| CI/CD | GitHub Actions | - | 5 workflows（详见 §13） |

---

## 3. 目录结构

```
src/
├── common/                        # 公共业务模块
│   ├── services/                  # Service V2 层
│   │   ├── authServiceV2.ts
│   │   ├── recordServiceV2.ts
│   │   ├── goalServiceV2.ts
│   │   ├── growthTreeServiceV2.ts # 含 children 嵌入
│   │   ├── reminderServiceV2.ts
│   │   ├── chatServiceV2.ts
│   │   ├── aiServiceV2.ts
│   │   └── repositoryFactory.ts   # 工厂：组装装饰器栈
│   └── repositories/              # 仓储接口 / 装饰器
│       └── repository.ts
├── components/                    # 通用 UI
│   ├── common/                    # Button / Card / Input / Modal
│   ├── growth-tree/               # 技能树可视化
│   └── Layout.tsx                 # 顶层布局
├── contexts/                      # AuthContext（轻量）
├── hooks/                         # useStorageStats / useKeyboardShortcuts
├── i18n/                          # i18next 配置 + 2 个 locale
│   ├── index.ts
│   ├── zh-CN.json                 # 270+ keys
│   └── en-US.json
├── pages/                         # 路由页
│   ├── dashboard/
│   ├── records/
│   ├── goals/
│   ├── reminders/
│   ├── growth-tree/
│   ├── analytics/
│   ├── auth/                      # 登录/注册
│   └── settings/                  # StorageSettings（新）
├── store/                         # Redux Toolkit
│   ├── index.ts                   # configureStore + AppDispatch
│   └── slices/
│       ├── authSlice.ts
│       ├── growthSlice.ts
│       ├── goalSlice.ts
│       ├── reminderSlice.ts
│       ├── themeSlice.ts
│       └── aiSlice.ts
├── storage/                       # ← 核心：存储抽象层
│   ├── adapters/                  # 3 个 StorageAdapter 实现
│   │   ├── indexeddb.ts           # idb 包装，含 7 entity stores
│   │   ├── localStorage.ts        # legacy adapter（单 key 限制）
│   │   └── inMemory.ts            # 内存版（测试用）
│   ├── common/
│   │   └── repositories/
│   │       ├── repository.ts      # IRepository<T> 接口
│   │       ├── baseRepository.ts  # 默认实现
│   │       ├── cachingRepository.ts
│   │       └── syncedRepository.ts
│   ├── schema/                    # IndexedDB schema + migrations
│   │   ├── index.ts
│   │   ├── migrations.ts          # 版本升级表
│   │   └── types.ts               # 7 entity 类型 + ENTITY_STORES
│   ├── config/
│   │   └── storageConfig.ts       # 单例：getStorageBackend / setStorageBackend
│   ├── migration/                 # ← 跨切：backend 间数据迁移
│   │   ├── dataMigrator.ts
│   │   └── index.ts
│   ├── backup/                    # ← 跨切：全量备份/恢复
│   │   ├── backupFormat.ts        # BackupData schema v2
│   │   ├── backupManager.ts       # 6 个 API
│   │   └── index.ts
│   ├── sync/                      # 跨 tab 同步
│   │   ├── crossTabChannel.ts
│   │   └── syncedRepository.ts
│   ├── quota/                     # 配额监控
│   │   ├── quotaMonitor.ts        # navigator.storage.estimate
│   │   └── index.ts
│   └── __tests__/                 # 22 + 17 + 5 = 44 存储测试
│       ├── migration/dataMigrator.test.ts
│       ├── backup/backupManager.test.ts
│       └── ...
├── types/                         # 全局类型（BaseEntity, RootState）
└── utils/                         # 加密 / XSS / 缓存 / token
```

---

## 4. 存储架构（核心）

### 4.1 三层抽象

```
业务代码 / Service V2
       ↓
Repository<T>  ←── 抽象接口（CRUD + query）
       ↓
StorageAdapter ←── 后端抽象（get / put / delete / count / getAll / clear）
       ↓
IndexedDB / LocalStorage / InMemory  ←── 具体实现
```

### 4.2 Repository 接口

```typescript
interface IRepository<T extends BaseEntity> {
  getById(id: string): Promise<T | null>;
  getAll(): Promise<T[]>;
  find(predicate: (entity: T) => boolean): Promise<T | null>;
  create(input: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T>;
  update(id: string, patch: Partial<T>): Promise<T>;
  delete(id: string): Promise<void>;
  deleteAll(): Promise<void>;
  count(): Promise<number>;
}
```

### 4.3 装饰器栈

| 装饰器 | 职责 | 关键 API |
|--------|------|---------|
| `BaseRepository` | 默认实现：把 `getById/getAll` 委托给 `StorageAdapter` | - |
| `CachingRepository` | 读穿透：先查 `Map<string, T>`，命中返回；写入时失效缓存 | `invalidate(id)` |
| `SyncedRepository` | 跨 tab 同步：写时通过 `BroadcastChannel` 广播，订阅方失效缓存 | `crossTabChannel` |

**典型组合**：
```typescript
const base = new BaseRepository<Record>('records', indexeddbAdapter);
const cached = new CachingRepository(base);
const synced = new SyncedRepository(cached);
export const recordRepository = synced;
```

### 4.4 StorageAdapter 抽象

```typescript
interface StorageAdapter {
  get<T>(store: string, key: string): Promise<T | undefined>;
  put<T>(store: string, key: string, value: T): Promise<void>;
  putMany<T>(store: string, entries: [string, T][]): Promise<void>;
  delete(store: string, key: string): Promise<void>;
  clear(store: string): Promise<void>;
  count(store: string): Promise<number>;
  getAll<T>(store: string): Promise<T[]>;
  getAllKeys(store: string): Promise<string[]>;
  readonly kind: StorageBackendKind;
}
```

三种实现：
- `IndexedDBAdapter`（推荐）：`idb` 包装，单一 DB `growthos`，7 个 object stores
- `LocalStorageAdapter`（legacy）：**单 key 单记录**（pre-existing 限制，多记录表只保留最后一条）
- `InMemoryAdapter`（测试/调试）：刷新即清空

### 4.5 Backend 切换 + 迁移

`StorageBackendConfig` 是单例，存于 `localStorage` key `growthos:storageBackend`：

```typescript
const config = getStorageBackendConfig();
config.setStorageBackend('indexeddb'); // 触发迁移
```

切换流程：
1. 调用 `migrateBetweenBackends(fromKind, toKind, options?)`
2. 按 `MIGRATABLE_TABLES` registry 顺序迁移 7 张表（records / goals / reminders / trees / users / chatSessions / chatMessages）
3. 每张表 `getAll()` → 写入目标 → 跳过已存在 ID（merge）或先 clear（overwrite）
4. 失败：捕获错误继续下一张，返回 `TableMigrationResult[]`
5. 全部成功 → 持久化选择 + `window.location.reload()`

### 4.6 IndexedDB Schema

DB name: `growthos` · Version: 当前（schema 升级通过 `migrations.ts` 注册）

Object stores：
| Store | KeyPath | 索引 |
|-------|---------|------|
| records | id | by-date, by-tag |
| goals | id | by-status |
| reminders | id | by-dueAt, by-completed |
| trees | id | - |
| users | id | by-email |
| chatSessions | id | by-userId, by-updatedAt |
| chatMessages | id | by-sessionId, by-createdAt |

---

## 5. 跨切关注点

### 5.1 备份恢复（`storage/backup/`）

**BackupData schema（v2）**：
```json
{
  "$type": "growthos-backup",
  "$version": 1,
  "schemaVersion": 2,
  "timestamp": "2026-06-04T12:00:00.000Z",
  "appVersion": "1.0.0",
  "data": {
    "records": [...],
    "goals": [...],
    "reminders": [...],
    "trees": [...],
    "users": [...],
    "chatSessions": [...],
    "chatMessages": [...],
    "preferences": {
      "llmConfig": {...} | null,
      "aiSettings": {...} | null,
      "currentUser": {...} | null
    }
  }
}
```

**API**（6 个）：
- `createBackup(options?)` - 从当前 backend 读所有数据
- `restoreFromBackup(backup, options)` - 恢复（merge/overwrite）
- `parseBackup(content)` - JSON 解析 + validate
- `validateBackup(input)` - 类型守卫
- `downloadBackup(backup, fileName?)` - 浏览器下载
- `readBackupFile(file)` - File → BackupData

**错误码**（`BackupFormatError.code`）：
- `INVALID_ROOT` / `INVALID_MARKER` / `VERSION_MISMATCH`
- `INVALID_DATA` / `INVALID_FIELD`
- `INVALID_PREFERENCES` / `INVALID_JSON`

**RestoreOptions**：
- `mode: 'merge' | 'overwrite'`
- `includePreferences: boolean`
- `includeCredentials: boolean`

### 5.2 数据迁移（`storage/migration/`）

详见 §4.5。核心：MIGRATABLE_TABLES registry + `migrateTable` / `migrateBetweenBackends` / `estimateMigrationSize`。

**已知限制**：LS adapter 是单 key 单记录（pre-existing），LS 后端对多记录表只能保留最后一条，备份/迁移会照实复制并注释说明。

### 5.3 跨 tab 同步（`storage/sync/`）

`SyncedRepository` 包装后，跨 tab 行为：
1. tab A 写入 → `BroadcastChannel` 广播 `{ type: 'invalidate', store, id? }`
2. tab B 订阅 → 缓存失效，下次读穿透
3. 写入冲突：last-write-wins（无 LWW 之外的解决策略，后续可加 CRDT）

### 5.4 配额监控（`storage/quota/`）

`getQuotaMonitor().check()` 返回：
- `usage: number` (bytes)
- `quota: number`
- `percent: number`
- `level: 'ok' | 'warn' | 'critical' | 'exceeded'`

UI 卡片在 StorageSettings 显示彩色进度条 + 等级标签。

---

## 6. 服务层设计

### 6.1 服务层职责

| 服务 | 职责 | 关键方法 |
|------|------|---------|
| authServiceV2 | 用户注册/登录/密码 | `register`, `login`, `logout`, `getCurrentUser` |
| recordServiceV2 | 每日记录 CRUD | `create`, `update`, `delete`, `search` |
| goalServiceV2 | 目标 + 进度 | `createGoal`, `addMilestone`, `updateProgress` |
| growthTreeServiceV2 | 技能树 + 节点（**children 嵌入存储**） | `createTree`, `addNode`, `pruneBranch` |
| reminderServiceV2 | 提醒 + 到期扫描 | `create`, `snooze`, `markCompleted` |
| chatServiceV2 | AI 对话会话 + 消息 | `createSession`, `appendMessage` |
| aiServiceV2 | 调用 LLM（OpenAI 兼容） | `sendMessage`, `stream` |

### 6.2 工厂模式

`repositoryFactory.ts` 集中组装装饰器栈，避免散落：
```typescript
export const recordRepository = createSyncedCachingRepository<Record>('records');
```

### 6.3 错误处理

- `RepositoryError`（基类）
- `NotFoundError`, `ValidationError`, `StorageError`
- 统一在 service 层 throw，由 async thunk 捕获

---

## 7. 状态管理

### 7.1 Redux Store 结构

```typescript
interface RootState {
  auth: { user, isAuthenticated, isLoading, error }
  growth: { records, tags, trees, isLoading, error }
  goals: { goals, isLoading, error }
  reminders: { reminders, isLoading, error }
  theme: { isDarkMode }
  ai: { sessions, messages, isStreaming, error }
}
```

### 7.2 数据流

```
User → Component → dispatch(thunk) → Service V2
       ↑                                    ↓
       └── re-render ← reducer ←────────────┘
                                          ↓
                                   Repository Decorator
                                          ↓
                                   StorageAdapter
                                          ↓
                                   IndexedDB / LS
```

### 7.3 缓存与 Redux 关系

- 装饰器层的 `CachingRepository` 是**进程内**缓存（`Map`），减少 IDB 读次数
- Redux 缓存是**派生数据**（selectors + `useMemo`）
- 两者不冲突：装饰器层缓存数据本身，Redux 缓存 UI 状态

---

## 8. UI / 组件

### 8.1 组件分类

| 分类 | 路径 | 职责 |
|------|------|------|
| 页面 | `src/pages/**` | 对应路由，含业务编排 |
| 通用 | `src/components/common/` | Button, Card, Input, Modal（无业务） |
| 业务 | `src/components/growth-tree/` | 技能树可视化 |
| 布局 | `src/components/Layout.tsx` | 侧边栏 + 顶栏 + 暗色主题 |

### 8.2 主题

`theme` slice 控制 `dark` / `light`，写入 `data-theme` 属性。Tailwind 通过 `var(--color-*)` 读取 design token。

### 8.3 国际化

- i18next + react-i18next
- 2 locale：zh-CN / en-US，270+ keys
- 命名空间：`common`, `navigation`, `auth`, `storage`, `backup`, `moods`, ...
- 所有用户面文案走 `t('namespace.key')`，**禁止硬编码中英文**

---

## 9. 路由设计

```typescript
const routes = [
  { path: '/login', element: <Login /> },
  { path: '/register', element: <Register /> },
  { path: '/', element: <Layout />, children: [
    { index: true, element: <Dashboard /> },
    { path: 'records', element: <Records /> },
    { path: 'goals', element: <Goals /> },
    { path: 'reminders', element: <Reminders /> },
    { path: 'analytics', element: <Analytics /> },
    { path: 'growth-tree', element: <GrowthTree /> },
    { path: 'settings/storage', element: <StorageSettings /> },
  ]},
];
```

- `HashRouter`（GitHub Pages 友好，无需服务端 fallback）
- 路由守卫：未登录 → 重定向 `/login`

---

## 10. 安全

| 措施 | 实现 | 文件 |
|------|------|------|
| 密码哈希 | SHA-256 + 盐 | `utils/secureEncryption.ts` |
| 加密存储 | AES (CryptoJS) | `utils/secureStorage.ts`（legacy） |
| Token | JWT-like 短期 token + 刷新 | `utils/tokenManager.ts` |
| XSS 防护 | 输入 sanitization | `utils/xssSanitizer.ts` |
| CSP | `<meta http-equiv="Content-Security-Policy">` | `index.html` |

**注意**：纯前端加密是**可绕过**的（攻击者能改 JS），敏感数据应假设可在客户端读取。真正保密需结合服务端（不在本仓库范围）。

---

## 11. 性能

| 策略 | 实现 |
|------|------|
| 代码分割 | `React.lazy` + `Suspense`（按页） |
| 缓存 | `CachingRepository` 减少 IDB 读 |
| 虚拟化 | 后续：`react-window` 长列表（记录/聊天） |
| 防抖 | 搜索 / 自动保存输入 |
| Build | Vite tree-shaking + terser + 分包 |

---

## 12. 测试

### 12.1 现状（2026-06）

| 指标 | 值 |
|------|---|
| 测试套件 | 34 |
| 测试数 | 499 |
| 通过率 | 100% |
| 覆盖率 | services 80%+，utils 70%+，components 60%+ |
| 运行时间 | ~13s |
| IDB polyfill | fake-indexeddb（jest-jsdom） |

### 12.2 测试类型

| 类型 | 工具 | 覆盖 |
|------|------|------|
| 单元 | Jest | Repositories / Adapters / Migrator / BackupManager / utils |
| 组件 | @testing-library/react | 通用组件 + StorageSettings（含 BackupCard） |
| 集成 | Jest + RTL | 页面 + Redux thunks |
| E2E | Playwright | `e2e/app.spec.ts`（continue-on-error，路由保护 flaky） |

### 12.3 关键测试文件

- `src/storage/__tests__/migration/dataMigrator.test.ts`（17 测试）
- `src/storage/__tests__/backup/backupManager.test.ts`（22 测试）
- `src/__tests__/pages/settings/StorageSettings.test.tsx`（22 测试）

---

## 13. CI/CD

### 13.1 Workflows（`.github/workflows/`）

| 文件 | 触发 | 主要步骤 | 关键修复 |
|------|------|---------|---------|
| `ci.yml` | push/PR main,develop | lint → tsc → test:ci → build + Codecov | 加 concurrency；移除冗余 e2e |
| `e2e.yml` | push/PR + 手动 | build → preview (background) → Playwright | 统一 TS；continue-on-error 应对 flaky |
| `cd.yml` | CI workflow_run success | staging (develop) / production (main) | **`workflows: ["CI"]`**（之前错写"CI Pipeline"）；Node 20 |
| `deploy.yml` | push main + 手动 | GitHub Pages + GitHub Release | 替换 deprecated `actions/create-release@v1` 为 `softprops/action-gh-release@v2` |
| `pr-review.yml` | PR open/sync | 自动评论 + size label | 保留 |

### 13.2 关键策略

- **并发控制**：`concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`
- **缓存**：`actions/setup-node@v4` 的 npm 缓存（基于 `package-lock.json`）
- **CD 链**：CI success → CD workflow_run → 部署
- **Codecov**：需 `CODECOV_TOKEN` secret（无也允许 PR 通过）
- **YAML 校验**：本地 PyYAML 7 文件 OK

### 13.3 依赖更新

Dependabot 每周一 09:00 (Asia/Shanghai) 检查 npm + GitHub Actions，按生态分组（`npm`、`github-actions`）。

详见 [.github/CI_CD.md](../.github/CI_CD.md)。

---

## 14. 部署

### 14.1 Web（GitHub Pages）

```
push main → CI 成功 → CD (production) → GitHub Pages
手动 workflow_dispatch + environment=production → release
```

### 14.2 移动端（Capacitor）

```
npm run build → npx cap sync → native build → App Store
```

### 14.3 Native SQLite（后续）

当前 `InMemoryAdapter` 路径可扩展为 Native SQLite（Capacitor SQLite plugin），无需改 Service V2。

---

## 15. 扩展性

### 15.1 新增存储后端

实现 `StorageAdapter` 接口 → 在 `repositoryFactory` 加分支 → 在 `MIGRATABLE_TABLES` 注册迁移路径。

### 15.2 新增横切关注点

实现新装饰器（参考 `CachingRepository` / `SyncedRepository`），在工厂中组合。

### 15.3 云端同步（后续）

`SyncedRepository` 已为云端同步预留 — 只需替换 `BroadcastChannel` 为 WebSocket / SSE，业务层无感。

---

## 16. 修订历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 2.0 | 2026-06-04 | v2 全面重写：IndexedDB 主导 + Repository 装饰器栈 + 迁移/备份 + 新 CI/CD |
| 1.0 | 2026-05-12 | 初始版本（LS 为主 + Context + 直写存储） |
