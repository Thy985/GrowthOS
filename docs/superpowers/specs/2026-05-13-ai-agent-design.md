# GrowthOS AI Agent 设计文档

## 1. 概述

本文档描述 GrowthOS 中 AI Agent（成长导师）的设计，提供个性化的成长建议和智能分析功能。

### 1.1 核心特点

- **多 Provider 支持**：支持 OpenAI、Anthropic、DeepSeek 等多个 LLM 提供者
- **工具系统**：Agent 可以安全访问用户的成长数据
- **隐私优先**：数据本地化，API Key 加密存储
- **智能交互**：聊天界面 + 主动建议卡片

---

## 2. 系统架构

```
┌─────────────────────────────────────────────────────────────────┐
│                          UI 层                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │  聊天界面    │  │  建议卡片    │  │  设置面板    │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
└─────────┼─────────────────┼─────────────────┼───────────────────┘
          │                 │                 │
┌─────────▼─────────────────▼─────────────────▼───────────────────┐
│                       Agent 控制层                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │              Agent Orchestrator                          │   │
│  │  - 任务路由  - 提示词注入  - 工具调用  - 响应处理         │   │
│  └─────────────────────────────────────────────────────────┘   │
└──────────────┬─────────────────┬───────────────────────────────┘
               │                 │
┌──────────────▼──────┐  ┌───────▼──────────────────┐
│   LLM Provider 层   │  │   工具系统 (Tools)      │
│  - OpenAI         │  │  - 查询成长树           │
│  - Anthropic      │  │  - 分析记录             │
│  - DeepSeek       │  │  - 目标进度分析         │
│  - 自定义 Provider │  │  - 徽章建议             │
└─────────────────────┘  └──────────────────────────┘
         │
┌────────▼───────────────┐
│   配置/存储层          │
│  - API Key 加密管理     │
│  - 对话历史存储        │
│  - 设置存储            │
└────────────────────────┘
```

---

## 3. 数据模型

### 3.1 LLM 相关类型

```typescript
// LLM 提供者
export type LLMProvider = 'openai' | 'anthropic' | 'deepseek' | 'custom';

// LLM 配置
export interface LLMConfig {
  provider: LLMProvider;
  apiKey: string;
  baseUrl?: string;
  model: string;
  temperature: number;
  maxTokens: number;
}

// 默认配置
export const DEFAULT_LLM_CONFIG: Record<LLMProvider, Omit<LLMConfig, 'apiKey'>> = {
  openai: {
    provider: 'openai',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: 'https://api.openai.com/v1'
  },
  anthropic: {
    provider: 'anthropic',
    model: 'claude-3-haiku-20240307',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: 'https://api.anthropic.com/v1'
  },
  deepseek: {
    provider: 'deepseek',
    model: 'deepseek-chat',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: 'https://api.deepseek.com/v1'
  },
  custom: {
    provider: 'custom',
    model: 'gpt-4o',
    temperature: 0.7,
    maxTokens: 1000,
    baseUrl: ''
  }
};
```

### 3.2 对话相关类型

```typescript
// 聊天消息角色
export type ChatMessageRole = 'user' | 'assistant' | 'system' | 'tool';

// 聊天消息
export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
  tokens?: number;
}

// 对话会话
export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

// 完整会话（包含消息）
export interface ChatSessionWithMessages extends ChatSession {
  messages: ChatMessage[];
}
```

### 3.3 工具系统类型

```typescript
// 工具参数类型
export interface ToolParameter {
  name: string;
  type: 'string' | 'number' | 'boolean';
  required: boolean;
  description: string;
}

// 工具定义
export interface Tool {
  id: string;
  name: string;
  description: string;
  parameters: ToolParameter[];
  handler: (params: Record<string, any>) => Promise<any>;
}

// 工具调用结果
export interface ToolCallResult {
  toolName: string;
  success: boolean;
  data?: any;
  error?: string;
}
```

---

## 4. 存储策略

### 4.1 存储方案设计

| 数据类型 | 存储位置 | 说明 |
|---------|---------|------|
| API Key | SecureStorage（加密） | 敏感信息，加密存储 |
| LLM 配置 | SecureStorage | 模型选择、温度等 |
| 会话元数据 | SecureStorage | 会话列表、摘要 |
| 近期聊天历史 | SecureStorage | 最近 50 条消息 |
| 归档聊天历史 | LocalStorage（分片） | 旧消息，压缩存储 |

### 4.2 存储键常量

```typescript
export const AI_STORAGE_KEYS = {
  LLM_CONFIG: 'ai_llm_config',
  CHAT_SESSIONS: 'ai_chat_sessions',
  RECENT_MESSAGES: 'ai_recent_messages',
  ARCHIVED_MESSAGES: 'ai_archived_messages',
  SETTINGS: 'ai_settings'
};
```

---

## 5. 工具系统

### 5.1 Agent 可用工具

| 工具 ID | 工具名称 | 功能描述 |
|---------|---------|---------|
| `getGrowthTrees` | 获取技能树 | 获取用户的技能树数据 |
| `getRecords` | 获取记录 | 获取每日记录（支持筛选） |
| `getGoals` | 获取目标 | 获取目标列表 |
| `getReminders` | 获取提醒 | 获取提醒列表 |
| `getBadges` | 获取徽章 | 获取已解锁徽章 |
| `analyzeMoodTrend` | 情绪趋势分析 | 分析用户情绪变化 |
| `analyzeProgress` | 进度分析 | 分析目标和技能树进度 |
| `suggestNextStep` | 下一步建议 | 智能推荐下一步行动 |

### 5.2 工具实现原则

- 只读访问：工具不能修改用户数据
- 安全限制：每次调用的数据量限制
- 性能优化：数据缓存机制

---

## 6. 提示词设计

### 6.1 System Prompt（成长导师）

```
你是 GrowthOS 的 AI 成长导师，帮助用户实现个人成长。

你的人设：
- 友好、鼓励、支持的导师
- 专业但不傲慢
- 善于发现用户的进步并给予肯定
- 建议具体、可行，有时间节点

你的职责：
1. 分析用户的成长树、记录、目标
2. 提供个性化的学习建议
3. 帮助用户建立良好的习惯
4. 当用户遇到挫折时给予鼓励
5. 发现用户没注意到的成长点

你的限制：
- 不要编造用户的数据
- 如果不确定，先询问用户
- 保持简洁，不要太啰嗦
- 尊重用户的隐私
```

### 6.2 上下文注入

在每个会话开始时，注入用户的当前状态摘要。

---

## 7. UI 组件设计

### 7.1 组件列表

| 组件名 | 位置 | 功能 |
|--------|------|------|
| `ChatWidget` | 右下角悬浮按钮 | 快捷入口，显示未读消息 |
| `ChatWindow` | 侧边栏/全屏 | 完整聊天界面 |
| `ChatMessageList` | 聊天窗口内 | 显示对话历史 |
| `ChatInput` | 聊天窗口底部 | 消息输入框 |
| `AISettings` | 设置页面 | API Key 配置、模型选择 |
| `AISuggestionCard` | 仪表盘、技能树页 | 智能建议卡片 |

### 7.2 交互流程

```
1. 用户点击悬浮按钮
   ↓
2. 展开聊天窗口（检查 API Key 配置）
   ↓
3. 用户发送消息
   ↓
4. Agent 执行工具调用（如需要）
   ↓
5. 生成并显示回复
```

---

## 8. 实施计划

### 阶段 1：基础框架
- 创建类型定义
- LLM Provider 抽象
- 基础存储服务

### 阶段 2：工具系统
- 实现各个工具函数
- 工具调用框架

### 阶段 3：核心功能
- Agent 编排器
- 对话管理
- 提示词工程

### 阶段 4：UI 组件
- 聊天界面
- 设置页面
- 建议卡片

### 阶段 5：集成与测试
- 与现有模块集成
- 测试与优化

---

## 9. 安全考虑

| 安全点 | 措施 |
|--------|------|
| API Key | AES 加密存储 |
| 数据访问 | 只读操作，记录审计日志 |
| 隐私 | 用户可以随时清除对话历史 |
| 网络 | HTTPS，请求超时保护 |

---

## 10. 未来扩展

- [ ] 本地 LLM 支持（WebLLM）
- [ ] 语音输入/输出
- [ ] 更多工具（学习资源推荐等）
- [ ] Agent 记忆系统

---

## 修订历史

| 版本 | 日期 | 描述 |
|------|------|------|
| 1.0.0 | 2026-05-13 | 初始版本 |
