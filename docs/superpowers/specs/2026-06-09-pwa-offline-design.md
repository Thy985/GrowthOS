# GrowthOS PWA 离线增强设计文档

## 1. 概述

本文档描述 GrowthOS PWA 离线功能的增强设计，实现 Service Worker 缓存、IndexedDB 离线存储、混合模式同步。

### 1.1 设计目标

- 支持完全离线使用核心功能
- 数据自动暂存，网络恢复后用户可控同步
- 冲突检测与解决
- 流畅的离线/在线状态切换体验

### 1.2 核心特点

- **混合存储**：secureStorage（加密敏感数据）+ IndexedDB（应用数据）
- **用户可控**：离线数据暂存，用户确认后批量同步
- **冲突处理**：版本比对，用户选择保留版本
- **渐进增强**：检测 Service Worker 支持，优雅降级

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────┐
│                      UI 层                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  同步状态    │  │  冲突解决    │  │  离线指示器  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                    数据层                                │
│  ┌──────────────────┐  ┌──────────────────────────────┐ │
│  │   secureStorage  │  │       IndexedDB             │ │
│  │  (敏感数据加密)   │  │  (应用数据 + 同步队列)     │ │
│  │  - API Keys     │  │  - Records                 │ │
│  │  - AI Config    │  │  - Goals                   │ │
│  │  - Auth Token   │  │  - Reminders               │ │
│  └──────────────────┘  │  - SyncQueue               │ │
│                        └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
                          │
┌─────────────────────────────────────────────────────────┐
│                  Service Worker                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │  静态资源缓存 │  │  API 拦截    │  │  后台同步   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## 3. 数据存储设计

### 3.1 IndexedDB Schema

```typescript
interface OfflineDB {
  // 应用数据存储
  records: {
    id: string;
    data: Record;
    syncStatus: 'synced' | 'pending' | 'conflict';
    localVersion: number;
    serverVersion?: number;
    createdAt: string;
    updatedAt: string;
  }[];

  goals: {
    id: string;
    data: Goal;
    syncStatus: 'synced' | 'pending' | 'conflict';
    localVersion: number;
    serverVersion?: number;
    createdAt: string;
    updatedAt: string;
  }[];

  reminders: {
    id: string;
    data: Reminder;
    syncStatus: 'synced' | 'pending' | 'conflict';
    localVersion: number;
    serverVersion?: number;
    createdAt: string;
    updatedAt: string;
  }[];

  // 同步队列
  syncQueue: {
    id: string;
    operation: 'create' | 'update' | 'delete';
    entityType: 'record' | 'goal' | 'reminder';
    entityId: string;
    payload: unknown;
    timestamp: string;
    retryCount: number;
  }[];

  // 同步元数据
  syncMeta: {
    lastSyncTime: string | null;
    serverVersion: Record<string, number>;
  };
}
```

### 3.2 存储职责划分

| 数据类型 | 存储位置 | 说明 |
|---------|---------|------|
| API Keys | secureStorage | 加密存储 |
| AI Config | secureStorage | 加密存储 |
| Auth Token | secureStorage | 加密存储 |
| 成长记录 | IndexedDB | 需要离线+同步 |
| 目标 | IndexedDB | 需要离线+同步 |
| 提醒 | IndexedDB | 需要离线+同步 |
| 同步队列 | IndexedDB | 离线操作暂存 |

---

## 4. 同步流程设计

### 4.1 数据操作流程

```
用户操作（创建/更新/删除）
         ↓
    写入 IndexedDB
         ↓
    添加到 SyncQueue (status: pending)
         ↓
    UI 更新，显示待同步徽章
         ↓
    [等待用户操作或网络恢复]
```

### 4.2 同步流程（用户触发）

```
用户点击"同步"按钮
         ↓
    检查网络状态
         ↓
    [在线] 继续同步流程
    [离线] 提示用户等待网络
         ↓
    批量处理 SyncQueue
         ↓
    ┌────────────────────────────┐
    │       逐个处理操作         │
    │  create → POST            │
    │  update → PUT (带版本号)  │
    │  delete → DELETE          │
    └────────────────────────────┘
         ↓
    ┌────────────────────────────┐
    │      处理响应             │
    │  成功 → 标记 synced      │
    │  冲突 → 标记 conflict     │
    │  失败 → 重试/跳过         │
    └────────────────────────────┘
         ↓
    [有冲突] 展示冲突解决 UI
    [全部成功] 提示同步完成
```

### 4.3 冲突处理策略

**冲突场景**：本地数据与服务器数据版本不一致

**解决方式**：
1. 显示对比视图（本地 vs 服务器）
2. 用户选择：保留本地 / 使用服务器 / 合并
3. 解决后更新本地版本号

---

## 5. Service Worker 设计

### 5.1 缓存策略

| 资源类型 | 缓存策略 | 说明 |
|---------|---------|------|
| HTML | Network First | 始终获取最新 |
| JS/CSS | Stale While Revalidate | 快速响应 + 后台更新 |
| 图片/字体 | Cache First | 离线可用 |
| API 数据 | Network Only (失败时返回空) | 不缓存数据 |
| 静态资源 | Precache (构建时) | 预缓存 |

### 5.2 动态缓存

```javascript
// 需要缓存的静态资源（构建时动态生成）
const STATIC_CACHE = 'growthos-static-v1';
const DYNAMIC_CACHE = 'growthos-dynamic-v1';

// 静态资源：install 时预缓存
// 动态资源：fetch 时按需缓存
```

### 5.3 后台同步

```javascript
// Background Sync API
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-pending-data') {
    event.waitUntil(processSyncQueue());
  }
});

// 定期同步（如果 Background Sync 不可用）
self.addEventListener('periodicsync', (event) => {
  if (event.tag === 'sync-tag') {
    event.waitUntil(processSyncQueue());
  }
});
```

---

## 6. UI 组件设计

### 6.1 离线状态指示器

```
┌────────────────────────────────────────────────────────┐
│  📴 离线模式 · 3 项待同步                    [同步]  │
└────────────────────────────────────────────────────────┘
```

- 位置：顶部导航栏下方
- 显示条件：网络离线 OR 有待同步数据
- 颜色：橙色（待同步）、灰色（离线）

### 6.2 同步面板

- 触发方式：点击"同步"按钮或待同步徽章
- 内容：待同步列表（可展开查看详情）
- 操作：全部同步 / 选择性同步 / 清除队列

### 6.3 冲突解决 Modal

```
┌────────────────────────────────────────────────────────┐
│                    ⚠️ 同步冲突                        │
├────────────────────────────────────────────────────────┤
│  目标：学习 React                                    │
│  ┌─────────────────┬─────────────────┐               │
│  │    本地版本     │    服务器版本    │               │
│  ├─────────────────┼─────────────────┤               │
│  │  进度: 60%     │  进度: 80%      │               │
│  │  更新: 今天    │  更新: 昨天     │               │
│  └─────────────────┴─────────────────┘               │
│                                                        │
│  [保留本地]  [使用服务器]  [合并]                     │
└────────────────────────────────────────────────────────┘
```

---

## 7. API 设计（前端模拟）

### 7.1 离线存储服务

```typescript
interface OfflineStorage {
  // 初始化
  init(): Promise<void>;

  // 通用 CRUD（自动添加到同步队列）
  create<T>(store: string, data: T): Promise<T>;
  update<T>(store: string, id: string, data: Partial<T>): Promise<T>;
  delete(store: string, id: string): Promise<void>;

  // 查询
  get<T>(store: string, id: string): Promise<T | null>;
  getAll<T>(store: string): Promise<T[]>;

  // 同步相关
  getPendingCount(): Promise<number>;
  getSyncQueue(): Promise<SyncOperation[]>;
  clearSyncQueue(): Promise<void>;
}
```

### 7.2 冲突解决

```typescript
interface ConflictResolver {
  detectConflicts(): Promise<Conflict[]>;
  resolveConflict(
    entityType: string,
    entityId: string,
    resolution: 'local' | 'server' | 'merge',
    mergedData?: unknown
  ): Promise<void>;
}
```

---

## 8. 技术实现

### 8.1 文件结构

```
src/
  ├── utils/
  │   ├── offlineStorage.ts      # IndexedDB 封装
  │   ├── syncQueue.ts          # 同步队列管理
  │   └── networkDetector.ts     # 网络状态检测
  ├── hooks/
  │   ├── useOfflineStatus.ts   # 离线状态 Hook
  │   └── useSyncQueue.ts       # 同步队列 Hook
  ├── components/
  │   ├── OfflineIndicator.tsx  # 离线指示器
  │   ├── SyncPanel.tsx         # 同步面板
  │   └── ConflictModal.tsx     # 冲突解决弹窗
  └── store/
      └── slices/
          └── syncSlice.ts      # Redux 同步状态

public/
  └── service-worker.js          # Service Worker
```

### 8.2 依赖

```json
{
  "dependencies": {
    "idb": "^8.0.0"  // IndexedDB Promise 封装
  }
}
```

---

## 9. 实施计划

### Phase 1: 基础架构
- 安装 idb 库
- 创建 IndexedDB Service
- 实现网络状态检测

### Phase 2: 数据层
- 重构记录/目标/提醒存储
- 实现 SyncQueue 管理
- 添加冲突检测

### Phase 3: Service Worker
- 重写 Service Worker（动态缓存）
- 实现后台同步
- 添加离线页面

### Phase 4: UI
- 离线状态指示器
- 同步面板
- 冲突解决 Modal

### Phase 5: 集成测试
- 离线场景测试
- 同步场景测试
- 冲突解决测试

---

## 10. 验收标准

1. ✅ 完全离线时可正常添加记录/目标/提醒
2. ✅ 网络恢复后正确显示待同步数据
3. ✅ 用户可手动触发同步
4. ✅ 冲突时正确提示用户
5. ✅ Service Worker 正确缓存静态资源
6. ✅ 离线时正确显示离线状态
