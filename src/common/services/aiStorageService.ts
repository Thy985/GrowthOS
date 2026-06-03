/**
 * Step 2 迁移：AI 存储从 secureStorage 拆分为：
 * - LLMConfig / AISettings → LocalStorageAdapter（小、单条）
 * - ChatSession / ChatMessage → IndexedDbAdapter（by-session 索引）
 *
 * 行为兼容：保持与旧 aiStorageService 完全一致的 API 表面
 * （getSessions / saveSession / addMessage / getSessionMessages / ...）
 */

import type {
  LLMConfig,
  ChatSession,
  ChatSessionWithMessages,
  ChatMessage,
} from '../../types';
import { AI_STORAGE_KEYS } from '../../constants';
import {
  createIndexedDbRepository,
  createLocalStorageRepository,
} from '../repositories/repository';
import type { ReadWriteRepository } from '../repositories/repository';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}

/**
 * IndexedDB 内部存储的 ChatMessage
 * 多了 sessionId 字段（业务 ChatMessage 类型不包含 sessionId，
 * 但存储层需要用它走 by-session 索引）
 */
interface StoredChatMessage {
  id: string,
  sessionId: string,
  role: ChatMessage['role'],
  content: string,
  timestamp: string,
  tokens?: number,
}

function toStoredMessage(sessionId: string, msg: ChatMessage): StoredChatMessage {
  return {
    id: msg.id,
    sessionId,
    role: msg.role,
    content: msg.content,
    timestamp: msg.timestamp,
    tokens: msg.tokens,
  };
}

function fromStoredMessage(stored: StoredChatMessage): ChatMessage {
  return {
    id: stored.id,
    role: stored.role,
    content: stored.content,
    timestamp: stored.timestamp,
    tokens: stored.tokens,
  };
}

// Repositories（懒单例）
let llmConfigRepo: ReadWriteRepository<LLMConfigWithId> | null = null;
let aiSettingsRepo: ReadWriteRepository<AISettingsWithId> | null = null;
let sessionRepo: ReadWriteRepository<ChatSession> | null = null;
let messageRepo: ReadWriteRepository<StoredChatMessage> | null = null;

/**
 * LocalStorageAdapter 是"单 key 存单条"的模式。
 * 包一层加 id 字段以满足 BaseEntity 约束；运行时 id 固定为 'singleton'。
 */
type LLMConfigWithId = LLMConfig & { id: string };
type AISettingsWithId = AISettings & { id: string };
const SINGLETON_ID = 'singleton';

function getLLMConfigRepository(): ReadWriteRepository<LLMConfigWithId> {
  if (!llmConfigRepo) {
    llmConfigRepo = createLocalStorageRepository<LLMConfigWithId>(AI_STORAGE_KEYS.LLM_CONFIG, {
      cache: true,
      sync: true,
    });
  }
  return llmConfigRepo;
}

function getAISettingsRepository(): ReadWriteRepository<AISettingsWithId> {
  if (!aiSettingsRepo) {
    aiSettingsRepo = createLocalStorageRepository<AISettingsWithId>(AI_STORAGE_KEYS.SETTINGS, {
      cache: true,
      sync: true,
    });
  }
  return aiSettingsRepo;
}

function getSessionRepository(): ReadWriteRepository<ChatSession> {
  if (!sessionRepo) {
    sessionRepo = createIndexedDbRepository<ChatSession>('chatSessions', {
      cache: true,
      sync: true,
    });
  }
  return sessionRepo;
}

function getMessageRepository(): ReadWriteRepository<StoredChatMessage> {
  if (!messageRepo) {
    messageRepo = createIndexedDbRepository<StoredChatMessage>('chatMessages', {
      cache: true,
      sync: true,
    });
  }
  return messageRepo;
}

// === LLM Config ===

export const saveLLMConfig = async (config: LLMConfig): Promise<void> => {
  await getLLMConfigRepository().put({ ...config, id: SINGLETON_ID });
};

export const getLLMConfig = async (): Promise<LLMConfig | null> => {
  const stored = await getLLMConfigRepository().get(SINGLETON_ID);
  if (!stored) return null;
  const { id: _id, ...rest } = stored;
  return rest;
};

export const clearLLMConfig = async (): Promise<void> => {
  await getLLMConfigRepository().delete(SINGLETON_ID);
};

// === AI Settings ===

export interface AISettings {
  [key: string]: unknown,
}

export const saveAISettings = async (settings: AISettings): Promise<void> => {
  await getAISettingsRepository().put({ ...settings, id: SINGLETON_ID });
};

export const getAISettings = async (): Promise<AISettings> => {
  const stored = await getAISettingsRepository().get(SINGLETON_ID);
  if (!stored) return {};
  const { id: _id, ...rest } = stored;
  return rest;
};

export const clearAISettings = async (): Promise<void> => {
  await getAISettingsRepository().delete(SINGLETON_ID);
};

// === Sessions ===

export const getSessions = async (): Promise<ChatSession[]> => {
  const all = await getSessionRepository().getAll();
  return all.sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
};

export const createSession = async (title: string): Promise<ChatSession> => {
  const session: ChatSession = {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0,
  };

  await getSessionRepository().put(session);
  // 初始空消息（不创建 message 实体，等真的 add 时才有）
  return session;
};

export const updateSession = async (
  sessionId: string,
  updates: Partial<ChatSession>,
): Promise<ChatSession | null> => {
  const current = await getSessionRepository().get(sessionId);
  if (!current) return null;
  const next: ChatSession = {
    ...current,
    ...updates,
    id: current.id,
    updatedAt: new Date().toISOString(),
  };
  await getSessionRepository().put(next);
  return next;
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await getSessionRepository().delete(sessionId);
  // 级联删除该 session 的所有消息
  const messages = await getMessageRepository().getAll();
  const toDelete = messages.filter((m) => m.sessionId === sessionId);
  for (const m of toDelete) {
    await getMessageRepository().delete(m.id);
  }
};

// === Messages ===

export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  const all = await getMessageRepository().getAll();
  const sessionMessages = all
    .filter((m) => m.sessionId === sessionId)
    .sort((a, b) => (a.timestamp < b.timestamp ? -1 : 1));
  return sessionMessages.map(fromStoredMessage);
};

export const getSession = async (
  sessionId: string,
): Promise<ChatSessionWithMessages | null> => {
  const session = await getSessionRepository().get(sessionId);
  if (!session) return null;
  const messages = await getSessionMessages(sessionId);
  return { ...session, messages };
};

export const addMessage = async (
  sessionId: string,
  message: Omit<ChatMessage, 'id' | 'timestamp'>,
): Promise<ChatMessage> => {
  const newMessage: ChatMessage = {
    id: generateId(),
    ...message,
    timestamp: new Date().toISOString(),
  };
  await getMessageRepository().put(toStoredMessage(sessionId, newMessage));

  // 更新 session 的 messageCount + updatedAt
  const allMessages = await getMessageRepository().getAll();
  const messageCount = allMessages.filter((m) => m.sessionId === sessionId).length;
  await updateSession(sessionId, { messageCount });

  return newMessage;
};

export const updateMessage = async (
  sessionId: string,
  messageId: string,
  updates: Partial<ChatMessage>,
): Promise<ChatMessage | null> => {
  const current = await getMessageRepository().get(messageId);
  if (!current || current.sessionId !== sessionId) return null;
  const next: StoredChatMessage = {
    ...current,
    ...updates,
    id: current.id,
    sessionId: current.sessionId,
  };
  await getMessageRepository().put(next);
  return fromStoredMessage(next);
};

export const deleteMessage = async (
  sessionId: string,
  messageId: string,
): Promise<void> => {
  const current = await getMessageRepository().get(messageId);
  if (!current || current.sessionId !== sessionId) return;
  await getMessageRepository().delete(messageId);

  const allMessages = await getMessageRepository().getAll();
  const messageCount = allMessages.filter((m) => m.sessionId === sessionId).length;
  await updateSession(sessionId, { messageCount });
};

export const clearSessionMessages = async (sessionId: string): Promise<void> => {
  const allMessages = await getMessageRepository().getAll();
  const toDelete = allMessages.filter((m) => m.sessionId === sessionId);
  for (const m of toDelete) {
    await getMessageRepository().delete(m.id);
  }
};

/** 测试用：重置单例 */
export function __resetAIStorageRepositoryForTest(): void {
  llmConfigRepo = null;
  aiSettingsRepo = null;
  sessionRepo = null;
  messageRepo = null;
}

/** 测试用：注入 Repositories */
export function __setAIStorageRepositoriesForTest(repos: {
  llmConfig?: ReadWriteRepository<LLMConfigWithId> | null,
  aiSettings?: ReadWriteRepository<AISettingsWithId> | null,
  session?: ReadWriteRepository<ChatSession> | null,
  message?: ReadWriteRepository<StoredChatMessage> | null,
}): void {
  if ('llmConfig' in repos) llmConfigRepo = repos.llmConfig ?? null;
  if ('aiSettings' in repos) aiSettingsRepo = repos.aiSettings ?? null;
  if ('session' in repos) sessionRepo = repos.session ?? null;
  if ('message' in repos) messageRepo = repos.message ?? null;
}
