# GrowthOS 数据存储设计文档

## 1. 存储策略

### 1.1 存储架构

GrowthOS 采用**本地优先**的存储策略，数据直接存储在用户设备上，无需网络连接。

| 平台 | 存储方式 | 容量限制 | 说明 |
|------|----------|----------|------|
| Web | LocalStorage | ~5-10MB | 浏览器本地存储 |
| Android | SQLite | 无限制 | 原生 SQLite 数据库 |
| iOS | SQLite | 无限制 | 原生 SQLite 数据库 |

### 1.2 存储选择逻辑

```typescript
// src/utils/storageStrategy.ts
export function getStorage() {
  // 优先使用 Capacitor SQLite
  if (typeof window !== 'undefined' && (window as any).Capacitor) {
    return CapacitorStorage;
  }
  // 回退到 LocalStorage
  return LocalStorage;
}
```

### 1.3 存储键设计

所有存储键统一在 `src/constants/index.ts` 中管理：

```typescript
export const STORAGE_KEYS = {
  RECORDS: 'growth-records',
  TAGS: 'growth-tags',
  TREES: 'growth-trees',
  TREE_NODES: 'growth-tree-nodes',
  GOALS: 'growth-goals',
  REMINDERS: 'growth-reminders',
  USER: 'auth-user',
  USERS: 'auth-users',
  THEME: 'app-theme',
  SETTINGS: 'app-settings'
} as const;
```

---

## 2. 数据模型

### 2.1 实体关系图

```
┌──────────────┐       ┌──────────────┐
│     User     │       │     Tag      │
├──────────────┤       ├──────────────┤
│ id: ID       │       │ name: string │
│ email: string│       └──────────────┘
│ name?: string│
│ createdAt    │              │
└──────────────┘              │
       │                      │
       │                      │
       ▼                      │
┌──────────────┐              │
│    Tree      │◄─────────────┘
├──────────────┤       ┌──────────────┐
│ id: ID       │       │   Record     │
│ userId: ID   │       ├──────────────┤
│ name: string │       │ id: ID       │
│ createdAt    │       │ date?: string│
│ updatedAt?   │       │ activity     │
└──────────────┘       │ learning     │
       │               │ reflection   │
       │               │ mood: Mood   │
       ▼               │ tags: string[]
┌──────────────┐       │ createdAt    │
│   TreeNode    │       │ updatedAt?   │
├──────────────┤       └──────────────┘
│ id: ID       │
│ treeId: ID   │              │
│ parentId?    │              │
│ name: string │              │
│ type: NodeType│             │
│ mastery: number│             │
│ status: NodeStatus          │
│ startDate?    │             │
│ createdAt    │              │
│ updatedAt?   │              │
└──────────────┘              │
                             ▼
                      ┌──────────────┐
                      │    Goal      │
                      ├──────────────┤
                      │ id: ID       │
                      │ title: string│
                      │ description? │
                      │ targetValue  │
                      │ currentValue │
                      │ startDate    │
                      │ endDate      │
                      │ status       │
                      │ createdAt    │
                      │ updatedAt?   │
                      └──────────────┘
                             │
                             ▼
                      ┌──────────────┐
                      │  Reminder    │
                      ├──────────────┤
                      │ id: ID       │
                      │ title: string│
                      │ description? │
                      │ date: string │
                      │ time: string │
                      │ goalId?      │
                      │ isCompleted  │
                      │ createdAt    │
                      │ updatedAt?   │
                      └──────────────┘
```

---

## 3. 数据表结构

### 3.1 User 表（用户）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | string | PK | 用户ID（时间戳+随机数） |
| email | string | UNIQUE | 邮箱地址 |
| passwordHash | string | NOT NULL | 密码哈希（SHA-256） |
| name | string | | 用户名 |
| createdAt | string | NOT NULL | 创建时间（ISO格式） |

```typescript
interface User {
  id: string;
  email: string;
  passwordHash: string;
  name?: string;
  createdAt: string;
}
```

### 3.2 Record 表（每日记录）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | string | PK | 记录ID |
| date | string | | 记录日期（YYYY-MM-DD） |
| activity | string | NOT NULL | 今日活动 |
| learning | string | NOT NULL | 今日学习 |
| reflection | string | NOT NULL | 今日反思 |
| mood | string | NOT NULL | 情绪状态 |
| tags | string[] | | 关联标签 |
| createdAt | string | NOT NULL | 创建时间 |
| updatedAt | string | | 更新时间 |

```typescript
interface Record {
  id: string;
  date?: string;
  activity: string;
  learning: string;
  reflection: string;
  mood: Mood;
  tags: string[];
  createdAt: string;
  updatedAt?: string;
}

type Mood = '很好' | '一般' | '不太好';
```

### 3.3 Tree 表（技能树）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | string | PK | 树ID |
| userId | string | | 用户ID |
| name | string | NOT NULL | 树名称 |
| createdAt | string | NOT NULL | 创建时间 |
| updatedAt | string | | 更新时间 |

```typescript
interface Tree {
  id: string;
  userId?: string;
  name: string;
  createdAt: string;
  updatedAt?: string;
}
```

### 3.4 TreeNode 表（技能树节点）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | string | PK | 节点ID |
| treeId | string | FK | 所属树ID |
| parentId | string | FK, NULL | 父节点ID |
| name | string | NOT NULL | 节点名称 |
| type | string | NOT NULL | 节点类型 |
| mastery | number | DEFAULT 0 | 掌握程度（0-100） |
| status | string | DEFAULT | 节点状态 |
| startDate | string | | 开始日期 |
| createdAt | string | NOT NULL | 创建时间 |
| updatedAt | string | | 更新时间 |

```typescript
interface TreeNode {
  id: string;
  treeId: string;
  parentId: string | null;
  name: string;
  type: 'skill' | 'habit' | 'knowledge';
  mastery: number;
  status: 'not_started' | 'in_progress' | 'completed';
  startDate?: string;
  createdAt: string;
  updatedAt?: string;
}
```

### 3.5 Goal 表（目标）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | string | PK | 目标ID |
| title | string | NOT NULL | 目标标题 |
| description | string | | 目标描述 |
| targetValue | number | NOT NULL | 目标值 |
| currentValue | number | DEFAULT 0 | 当前进度 |
| startDate | string | NOT NULL | 开始日期 |
| endDate | string | NOT NULL | 结束日期 |
| status | string | DEFAULT | 目标状态 |
| createdAt | string | NOT NULL | 创建时间 |
| updatedAt | string | | 更新时间 |

```typescript
interface Goal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  startDate: string;
  endDate: string;
  status: 'active' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}
```

### 3.6 Reminder 表（提醒）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| id | string | PK | 提醒ID |
| title | string | NOT NULL | 提醒标题 |
| description | string | | 提醒描述 |
| date | string | NOT NULL | 提醒日期 |
| time | string | NOT NULL | 提醒时间 |
| goalId | string | FK, NULL | 关联目标ID |
| isCompleted | boolean | DEFAULT false | 是否完成 |
| createdAt | string | NOT NULL | 创建时间 |
| updatedAt | string | | 更新时间 |

```typescript
interface Reminder {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  goalId?: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt?: string;
}
```

### 3.7 Tag 表（标签）

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| name | string | PK | 标签名称 |
| count | number | DEFAULT 0 | 使用次数 |

```typescript
type Tag = string;
```

---

## 4. SQLite 实现

### 4.1 数据库初始化

```typescript
// src/common/services/dbService.ts
import { Capacitor } from '@capacitor/core';
import { CapacitorSQLite } from '@capacitor-community/sqlite';

const DB_NAME = 'growthos.db';
const DB_VERSION = 1;

export async function initDatabase(): Promise<void> {
  if (!Capacitor.isNativePlatform()) {
    console.log('Web平台使用LocalStorage');
    return;
  }

  try {
    await CapacitorSQLite.createConnection({
      database: DB_NAME,
      version: DB_VERSION
    });

    await CapacitorSQLite.open({ database: DB_NAME });

    // 创建表
    await createTables();
  } catch (error) {
    console.error('数据库初始化失败:', error);
    throw error;
  }
}

async function createTables(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      name TEXT,
      created_at TEXT NOT NULL
    )`,
    `CREATE TABLE IF NOT EXISTS records (
      id TEXT PRIMARY KEY,
      date TEXT,
      activity TEXT NOT NULL,
      learning TEXT NOT NULL,
      reflection TEXT NOT NULL,
      mood TEXT NOT NULL,
      tags TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT
    )`,
    // ... 其他表
  ];

  for (const sql of statements) {
    await CapacitorSQLite.execute({
      database: DB_NAME,
      statements: [sql]
    });
  }
}
```

### 4.2 数据操作示例

```typescript
// 创建记录
export async function createRecord(record: Record): Promise<void> {
  const sql = `
    INSERT INTO records (id, date, activity, learning, reflection, mood, tags, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `;

  await CapacitorSQLite.execute({
    database: DB_NAME,
    statements: [{
      statement: sql,
      values: [
        record.id,
        record.date || null,
        record.activity,
        record.learning,
        record.reflection,
        record.mood,
        JSON.stringify(record.tags),
        record.createdAt
      ]
    }]
  });
}

// 查询记录
export async function getRecords(): Promise<Record[]> {
  const result = await CapacitorSQLite.query({
    database: DB_NAME,
    statement: 'SELECT * FROM records ORDER BY created_at DESC'
  });

  return result.values?.map(row => ({
    id: row.id as string,
    date: row.date as string | undefined,
    activity: row.activity as string,
    learning: row.learning as string,
    reflection: row.reflection as string,
    mood: row.mood as Mood,
    tags: JSON.parse(row.tags as string || '[]'),
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string | undefined
  })) || [];
}
```

---

## 5. LocalStorage 实现

### 5.1 安全存储工具

```typescript
// src/utils/secureStorage.js
import CryptoJS from 'crypto-js';

const SECRET_KEY = 'growthos-secret-key'; // 生产环境应使用更安全的方式

export const secureStorage = {
  setItem(key, value) {
    const data = JSON.stringify(value);
    const encrypted = CryptoJS.AES.encrypt(data, SECRET_KEY).toString();
    localStorage.setItem(key, encrypted);
  },

  getItem(key) {
    const encrypted = localStorage.getItem(key);
    if (!encrypted) return null;

    try {
      const decrypted = CryptoJS.AES.decrypt(encrypted, SECRET_KEY);
      const data = decrypted.toString(CryptoJS.enc.Utf8);
      return JSON.parse(data);
    } catch (error) {
      console.error('解密失败:', error);
      return null;
    }
  },

  removeItem(key) {
    localStorage.removeItem(key);
  },

  clear() {
    localStorage.clear();
  }
};
```

### 5.2 数据操作示例

```typescript
// src/utils/storage.ts
import { secureStorage } from './secureStorage';
import { STORAGE_KEYS } from '@/constants';
import type { Record } from '@/types';

export function getRecords(): Record[] {
  return secureStorage.getItem(STORAGE_KEYS.RECORDS) || [];
}

export function setRecords(records: Record[]): void {
  secureStorage.setItem(STORAGE_KEYS.RECORDS, records);
}

export function addRecord(record: Record): void {
  const records = getRecords();
  records.push(record);
  setRecords(records);
}

export function updateRecord(id: string, updates: Partial<Record>): Record | null {
  const records = getRecords();
  const index = records.findIndex(r => r.id === id);

  if (index === -1) return null;

  records[index] = { ...records[index], ...updates };
  setRecords(records);
  return records[index];
}

export function deleteRecord(id: string): boolean {
  const records = getRecords();
  const filtered = records.filter(r => r.id !== id);

  if (filtered.length === records.length) return false;

  setRecords(filtered);
  return true;
}
```

---

## 6. 索引设计

### 6.1 SQLite 索引

```sql
-- 记录表索引
CREATE INDEX idx_records_date ON records(date);
CREATE INDEX idx_records_created_at ON records(created_at);

-- 树节点表索引
CREATE INDEX idx_tree_nodes_tree_id ON tree_nodes(tree_id);
CREATE INDEX idx_tree_nodes_parent_id ON tree_nodes(parent_id);

-- 提醒表索引
CREATE INDEX idx_reminders_date ON reminders(date);
CREATE INDEX idx_reminders_goal_id ON reminders(goal_id);

-- 目标表索引
CREATE INDEX idx_goals_status ON goals(status);
CREATE INDEX idx_goals_end_date ON goals(end_date);
```

---

## 7. 数据迁移

### 7.1 迁移策略

当数据模型变更时，使用版本号管理迁移：

```typescript
// src/common/services/dbService.ts
const CURRENT_VERSION = 1;

async function migrateIfNeeded() {
  const version = secureStorage.getItem('db_version') || 0;

  if (version < CURRENT_VERSION) {
    for (let v = version + 1; v <= CURRENT_VERSION; v++) {
      await migrateTo(v);
    }
    secureStorage.setItem('db_version', CURRENT_VERSION);
  }
}

async function migrateTo(version: number) {
  switch (version) {
    case 1:
      // 初始化数据库
      break;
    // 后续版本迁移...
  }
}
```

### 7.2 备份与恢复

```typescript
// 导出数据
export function exportData() {
  return {
    version: CURRENT_VERSION,
    exportedAt: new Date().toISOString(),
    data: {
      records: getRecords(),
      trees: getTrees(),
      goals: getGoals(),
      reminders: getReminders()
    }
  };
}

// 导入数据
export function importData(backup: any) {
  if (backup.version !== CURRENT_VERSION) {
    throw new Error('数据版本不兼容');
  }

  setRecords(backup.data.records || []);
  setTrees(backup.data.trees || []);
  setGoals(backup.data.goals || []);
  setReminders(backup.data.reminders || []);
}
```

---

## 8. 性能优化

### 8.1 批量操作

```typescript
// 批量写入
export async function batchCreateRecords(records: Record[]): Promise<void> {
  const allRecords = getRecords();
  allRecords.push(...records);
  setRecords(allRecords);
}

// 分页查询
export function getRecordsPaginated(page: number, pageSize: number = 20) {
  const allRecords = getRecords();
  const start = (page - 1) * pageSize;
  const end = start + pageSize;

  return {
    data: allRecords.slice(start, end),
    total: allRecords.length,
    page,
    pageSize,
    totalPages: Math.ceil(allRecords.length / pageSize)
  };
}
```

### 8.2 缓存策略

```typescript
// 内存缓存
let cache: {
  records: Record[] | null;
  lastFetch: number;
} = {
  records: null,
  lastFetch: 0
};

const CACHE_TTL = 5 * 60 * 1000; // 5分钟

export function getRecords(): Record[] {
  const now = Date.now();

  if (cache.records && now - cache.lastFetch < CACHE_TTL) {
    return cache.records;
  }

  cache.records = secureStorage.getItem(STORAGE_KEYS.RECORDS) || [];
  cache.lastFetch = now;

  return cache.records;
}

export function invalidateCache() {
  cache.records = null;
  cache.lastFetch = 0;
}
```

---

## 9. 数据安全

### 9.1 敏感数据加密

```typescript
// 使用 Web Crypto API 加密敏感数据
async function encryptData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const dataBuffer = encoder.encode(data);

  const key = await crypto.subtle.generateKey(
    { name: 'AES-GCM', length: 256 },
    true,
    ['encrypt', 'decrypt']
  );

  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encryptedBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    dataBuffer
  );

  // 导出密钥用于后续解密
  const exportedKey = await crypto.subtle.exportKey('raw', key);

  return JSON.stringify({
    iv: Array.from(iv),
    key: Array.from(new Uint8Array(exportedKey)),
    data: Array.from(new Uint8Array(encryptedBuffer))
  });
}
```

---

## 10. 修订历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2026-05-12 | 初始版本 |
