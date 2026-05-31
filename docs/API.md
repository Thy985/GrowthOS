# GrowthOS API Documentation

## Overview

GrowthOS is a personal growth tracking application with offline-first capabilities. This document describes the internal API services and utilities.

## Authentication

### authServiceV2.ts

```typescript
// 登录
export async function login(credentials: LoginCredentials): Promise<AuthResponse>

// 注册
export async function register(userData: RegisterData): Promise<AuthResponse>

// 登出
export async function logout(): Promise<void>

// 刷新 Token
export async function refreshAccessToken(): Promise<TokenPair>

// 获取当前用户
export async function getCurrentUser(): Promise<User | null>

// 验证邮箱
export async function verifyEmail(token: string): Promise<boolean>

// 发送重置密码邮件
export async function sendPasswordResetEmail(email: string): Promise<void>
```

## Data Storage

### offlineStorage.ts

```typescript
// 初始化数据库
export async function initOfflineDB(): Promise<IDBDatabase>

// 保存实体
export async function saveEntity<T extends BaseEntity>(
  store: 'records' | 'goals' | 'reminders' | 'sessions',
  entity: T
): Promise<string>

// 获取实体
export async function getEntity<T>(
  store: 'records' | 'goals' | 'reminders' | 'sessions',
  id: string
): Promise<T | undefined>

// 更新实体
export async function updateEntity<T extends BaseEntity>(
  store: 'records' | 'goals' | 'reminders' | 'sessions',
  entity: T
): Promise<void>

// 删除实体
export async function deleteEntity(
  store: 'records' | 'goals' | 'reminders' | 'sessions',
  id: string
): Promise<void>

// 获取所有实体
export async function getAllEntities<T>(
  store: 'records' | 'goals' | 'reminders' | 'sessions'
): Promise<T[]>

// 清空存储
export async function clearStore(
  store: 'records' | 'goals' | 'reminders' | 'sessions'
): Promise<void>
```

## Sync System

### syncQueue.ts

```typescript
// 添加到同步队列
export async function addToSyncQueue(item: SyncQueueItem): Promise<void>

// 从同步队列获取
export async function getFromSyncQueue(): Promise<SyncQueueItem | null>

// 标记同步成功
export async function markSyncSuccess(id: string): Promise<void>

// 标记同步失败
export async function markSyncFailure(id: string, error: string): Promise<void>

// 获取待同步数量
export async function getSyncQueueCount(): Promise<number>

// 清空同步队列
export async function clearSyncQueue(): Promise<void>

// 检查冲突
export async function checkConflicts(
  entityType: string,
  entityId: string
): Promise<ConflictInfo | null>

// 解决冲突
export async function resolveConflict(
  entityType: string,
  entityId: string,
  resolution: 'local' | 'server' | 'merge',
  mergedData?: Record<string, unknown>
): Promise<void>
```

## Security

### security.ts

```typescript
// CSRF Token 管理
export function initCSRFToken(): CSRFTokenData
export function getCSRFToken(): CSRFTokenData | null
export function validateCSRFToken(token: string): boolean
export function refreshCSRFToken(): CSRFTokenData

// 安全 Headers
export const DEFAULT_SECURITY_HEADERS: SecurityHeaders
export function applySecurityHeadersToResponse(): Record<string, string>

// 请求安全
export function createSecureRequestOptions(options?: SecureRequestOptions): SecureRequestOptions
export function addCSRFToHeaders(headers: Record<string, string>): Record<string, string>

// 速率限制
export class RateLimiter
export const apiRateLimiter: RateLimiter
export const authRateLimiter: RateLimiter

// 输入清理
export function sanitizeInput(input: string): string
export function validateUrl(url: string): boolean
```

### secureEncryption.ts

```typescript
// 加密数据
export async function encryptData(data: string, key?: string): Promise<EncryptedData>

// 解密数据
export async function decryptData(encrypted: EncryptedData, key?: string): Promise<string>

// 加密对象
export async function encryptObject<T>(obj: T, key?: string): Promise<string>

// 解密对象
export async function decryptObject<T>(encrypted: string, key?: string): Promise<T>

// 生成密钥
export function generateKey(): string

// 导出密钥
export function exportKey(key: CryptoKey): Promise<string>

// 导入密钥
export function importKey(keyData: string): Promise<CryptoKey>
```

## API Communication

### BaseService.ts

```typescript
class BaseService {
  async get<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>
  async post<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  async put<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  async patch<T>(endpoint: string, data?: unknown, config?: RequestConfig): Promise<ApiResponse<T>>
  async delete<T>(endpoint: string, config?: RequestConfig): Promise<ApiResponse<T>>
}
```

### RequestUtils.ts

```typescript
// 重试机制
export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T>

// 请求去重
export function deduplicator<T>(
  key: string,
  fn: () => Promise<T>
): () => Promise<T>

// 超时处理
export function withTimeout<T>(
  fn: () => Promise<T>,
  timeout: number
): Promise<T>
```

## State Management (Redux)

### Store Structure

```typescript
interface RootState {
  auth: AuthState,
  growth: GrowthState,
  goal: GoalState,
  reminder: ReminderState,
  sync: SyncState,
  ai: AIState,
  theme: ThemeState,
}
```

### Auth Slice

```typescript
// Actions
checkAuth: () => ThunkAction
login: (credentials: LoginCredentials) => ThunkAction
register: (userData: RegisterData) => ThunkAction
logout: () => ThunkAction
```

### Growth Slice

```typescript
// Actions
loadData: () => ThunkAction
addRecord: (record: RecordData) => ThunkAction
updateRecord: (id: string, updates: Partial<RecordData>) => ThunkAction
deleteRecord: (id: string) => ThunkAction
exportData: (options: ExportOptions) => ThunkAction
importData: (data: ImportData) => ThunkAction
```

### AI Slice

```typescript
// Actions
loadAIConfig: () => ThunkAction
saveAIConfig: (config: LLMConfig) => ThunkAction
createSession: (title?: string) => ThunkAction
sendMessage: (content: string) => ThunkAction
```

## Utility Functions

### goalUtils.ts

```typescript
calculateProgress(current: number, target: number): number
formatDate(date: string | Date, format?: string): string
getGoalStatusText(goal: Goal): string
validateGoalForm(data: GoalFormData): ValidationResult
```

### xssSanitizer.ts

```typescript
sanitizeHTML(input: string): string
sanitizeAttribute(name: string, value: string): string
isValidURL(url: string): boolean
stripAllTags(input: string): string
```

## Types

### Core Types

```typescript
interface BaseEntity {
  id: string,
  createdAt: string,
  updatedAt: string,
  userId: string,
}

interface RecordData extends BaseEntity {
  activity: string,
  mood: number,
  learning: string,
  tags: string[],
  date: string,
  notes?: string,
}

interface Goal extends BaseEntity {
  title: string,
  description: string,
  targetValue: number,
  currentValue: number,
  startDate: string,
  endDate: string,
  status: 'active' | 'completed' | 'paused',
}

interface Reminder extends BaseEntity {
  title: string,
  description: string,
  date: string,
  time: string,
  completed: boolean,
  notified: boolean,
}
```

## Error Handling

### ErrorFactory.ts

```typescript
export class AppError extends Error {
  code: string
  statusCode: number
  details?: Record<string, unknown>
}

ErrorFactory.badRequest(message: string, details?: object): AppError
ErrorFactory.unauthorized(message?: string): AppError
ErrorFactory.forbidden(message?: string): AppError
ErrorFactory.notFound(resource?: string): AppError
ErrorFactory.internal(message?: string): AppError
ErrorFactory.networkError(): AppError
ErrorFactory.storageError(message?: string): AppError
```

## Constants

### API Endpoints

```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api'
const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    REFRESH: '/auth/refresh',
    VERIFY: '/auth/verify',
  },
  DATA: {
    RECORDS: '/records',
    GOALS: '/goals',
    REMINDERS: '/reminders',
    SYNC: '/sync',
  },
  AI: {
    CONFIG: '/ai/config',
    SESSIONS: '/ai/sessions',
    MESSAGES: '/ai/messages',
  },
}
```

## Environment Variables

```bash
VITE_API_URL=https://api.growthos.example.com
VITE_API_TIMEOUT=30000
VITE_ENABLE_MOCK_API=false
VITE_APP_VERSION=1.0.0
```
