import type { LLMConfig, ChatSession, ChatSessionWithMessages, ChatMessage } from '../../types';
import { AI_STORAGE_KEYS } from '../../constants';
import { secureStorage } from '../../utils/secureStorage';

// 生成 ID 辅助函数
const generateId = (): string => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

// === LLM 配置存储 ===

export const saveLLMConfig = async (config: LLMConfig): Promise<void> => {
  const configToSave = {
    ...config,
    apiKey: config.apiKey // 已由 secureStorage 自动加密
  };
  secureStorage.setItem(AI_STORAGE_KEYS.LLM_CONFIG, configToSave);
};

export const getLLMConfig = async (): Promise<LLMConfig | null> => {
  return secureStorage.getItem<LLMConfig>(AI_STORAGE_KEYS.LLM_CONFIG);
};

export const clearLLMConfig = async (): Promise<void> => {
  secureStorage.removeItem(AI_STORAGE_KEYS.LLM_CONFIG);
};

// === 会话存储 ===

export const saveSessions = (sessions: ChatSession[]): void => {
  secureStorage.setItem(AI_STORAGE_KEYS.CHAT_SESSIONS, sessions);
};

export const getSessions = (): ChatSession[] => {
  return secureStorage.getItem<ChatSession[]>(AI_STORAGE_KEYS.CHAT_SESSIONS) || [];
};

export const createSession = (title: string): ChatSession => {
  const session: ChatSession = {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0
  };
  
  const sessions = getSessions();
  sessions.unshift(session);
  saveSessions(sessions);
  
  // 初始化会话消息
  saveSessionMessages(session.id, []);
  
  return session;
};

export const updateSession = (sessionId: string, updates: Partial<ChatSession>): ChatSession | null => {
  const sessions = getSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index === -1) return null;
  
  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  saveSessions(sessions);
  return sessions[index];
};

export const deleteSession = (sessionId: string): void => {
  const sessions = getSessions().filter(s => s.id !== sessionId);
  saveSessions(sessions);
  
  // 删除对应的消息
  localStorage.removeItem(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`);
  localStorage.removeItem(`${AI_STORAGE_KEYS.ARCHIVED_MESSAGES}_${sessionId}`);
};

// === 消息存储 ===

const SESSION_MESSAGES_LIMIT = 50;

export const getSessionMessages = (sessionId: string): ChatSessionWithMessages => {
  // 先获取会话元数据
  const sessions = getSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  // 获取近期消息
  const messages = secureStorage.getItem<ChatMessage[]>(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`) || [];
  
  return {
    ...session,
    messages
  };
};

export const addMessage = (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): ChatMessage => {
  const newMessage: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: new Date().toISOString()
  };
  
  // 获取现有消息
  const key = `${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`;
  let messages = secureStorage.getItem<ChatMessage[]>(key) || [];
  
  messages.push(newMessage);
  
  // 如果超过限制，归档旧消息
  if (messages.length > SESSION_MESSAGES_LIMIT) {
    const toArchive = messages.slice(0, messages.length - SESSION_MESSAGES_LIMIT);
    messages = messages.slice(messages.length - SESSION_MESSAGES_LIMIT);
    
    // 追加到归档
    const archiveKey = `${AI_STORAGE_KEYS.ARCHIVED_MESSAGES}_${sessionId}`;
    const archived = secureStorage.getItem<ChatMessage[]>(archiveKey) || [];
    secureStorage.setItem(archiveKey, [...archived, ...toArchive]);
  }
  
  secureStorage.setItem(key, messages);
  
  // 更新会话信息
  updateSession(sessionId, { messageCount: messages.length });
  
  return newMessage;
};

export const clearSessionMessages = (sessionId: string): void => {
  secureStorage.removeItem(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`);
  secureStorage.removeItem(`${AI_STORAGE_KEYS.ARCHIVED_MESSAGES}_${sessionId}`);
  updateSession(sessionId, { messageCount: 0 });
};

// === 设置存储 ===

interface AISettings {
  autoSuggestions: boolean;
  maxHistoryLength: number;
  showToolCalls: boolean;
}

const DEFAULT_SETTINGS: AISettings = {
  autoSuggestions: true,
  maxHistoryLength: 30,
  showToolCalls: false
};

export const getAISettings = (): AISettings => {
  return secureStorage.getItem<AISettings>(AI_STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS;
};

export const saveAISettings = (settings: Partial<AISettings>): void => {
  const current = getAISettings();
  secureStorage.setItem(AI_STORAGE_KEYS.SETTINGS, { ...current, ...settings });
};
