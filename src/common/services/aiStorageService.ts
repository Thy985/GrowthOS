import type { LLMConfig, ChatSession, ChatSessionWithMessages, ChatMessage } from '../../types';
import { AI_STORAGE_KEYS } from '../../constants';
import { secureStorage } from '../../utils/secureStorage';

const DEVICE_ID_KEY = '_growthos_device_id';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

async function ensureInitialized(): Promise<void> {
  await secureStorage.initialize();
}

export const saveLLMConfig = async (config: LLMConfig): Promise<void> => {
  await ensureInitialized();
  await secureStorage.setItem(AI_STORAGE_KEYS.LLM_CONFIG, config);
};

export const getLLMConfig = async (): Promise<LLMConfig | null> => {
  await ensureInitialized();
  return secureStorage.getItem<LLMConfig>(AI_STORAGE_KEYS.LLM_CONFIG);
};

export const clearLLMConfig = async (): Promise<void> => {
  await ensureInitialized();
  secureStorage.removeItem(AI_STORAGE_KEYS.LLM_CONFIG);
};

export const saveSessions = async (sessions: ChatSession[]): Promise<void> => {
  await ensureInitialized();
  await secureStorage.setItem(AI_STORAGE_KEYS.CHAT_SESSIONS, sessions);
};

export const getSessions = async (): Promise<ChatSession[]> => {
  await ensureInitialized();
  return secureStorage.getItem<ChatSession[]>(AI_STORAGE_KEYS.CHAT_SESSIONS) || [];
};

export const createSession = async (title: string): Promise<ChatSession> => {
  await ensureInitialized();
  
  const session: ChatSession = {
    id: generateId(),
    title,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    messageCount: 0
  };
  
  const sessions = await getSessions();
  sessions.unshift(session);
  await saveSessions(sessions);
  await saveSessionMessages(session.id, []);
  
  return session;
};

export const updateSession = async (sessionId: string, updates: Partial<ChatSession>): Promise<ChatSession | null> => {
  await ensureInitialized();
  
  const sessions = await getSessions();
  const index = sessions.findIndex(s => s.id === sessionId);
  
  if (index === -1) return null;
  
  sessions[index] = {
    ...sessions[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  await saveSessions(sessions);
  return sessions[index];
};

export const deleteSession = async (sessionId: string): Promise<void> => {
  await ensureInitialized();
  
  const sessions = (await getSessions()).filter(s => s.id !== sessionId);
  await saveSessions(sessions);
  
  localStorage.removeItem(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`);
  localStorage.removeItem(`${AI_STORAGE_KEYS.ARCHIVED_MESSAGES}_${sessionId}`);
};

const SESSION_MESSAGES_LIMIT = 50;

export const getSessionMessages = async (sessionId: string): Promise<ChatSessionWithMessages> => {
  await ensureInitialized();
  
  const sessions = await getSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) {
    throw new Error('Session not found');
  }
  
  const messages = await secureStorage.getItem<ChatMessage[]>(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`) || [];
  
  return {
    ...session,
    messages
  };
};

export const addMessage = async (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
  await ensureInitialized();
  
  const newMessage: ChatMessage = {
    ...message,
    id: generateId(),
    timestamp: new Date().toISOString()
  };
  
  const key = `${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`;
  let messages = await secureStorage.getItem<ChatMessage[]>(key) || [];
  
  messages.push(newMessage);
  
  if (messages.length > SESSION_MESSAGES_LIMIT) {
    const toArchive = messages.slice(0, messages.length - SESSION_MESSAGES_LIMIT);
    messages = messages.slice(messages.length - SESSION_MESSAGES_LIMIT);
    
    const archiveKey = `${AI_STORAGE_KEYS.ARCHIVED_MESSAGES}_${sessionId}`;
    const archived = await secureStorage.getItem<ChatMessage[]>(archiveKey) || [];
    await secureStorage.setItem(archiveKey, [...archived, ...toArchive]);
  }
  
  await secureStorage.setItem(key, messages);
  await updateSession(sessionId, { messageCount: messages.length });
  
  return newMessage;
};

export const clearSessionMessages = async (sessionId: string): Promise<void> => {
  await ensureInitialized();
  secureStorage.removeItem(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`);
  secureStorage.removeItem(`${AI_STORAGE_KEYS.ARCHIVED_MESSAGES}_${sessionId}`);
  await updateSession(sessionId, { messageCount: 0 });
};

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

export const getAISettings = async (): Promise<AISettings> => {
  await ensureInitialized();
  return secureStorage.getItem<AISettings>(AI_STORAGE_KEYS.SETTINGS) || DEFAULT_SETTINGS;
};

export const saveAISettings = async (settings: Partial<AISettings>): Promise<void> => {
  await ensureInitialized();
  const current = await getAISettings();
  await secureStorage.setItem(AI_STORAGE_KEYS.SETTINGS, { ...current, ...settings });
};
