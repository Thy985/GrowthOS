import type { LLMConfig, ChatSession, ChatSessionWithMessages, ChatMessage } from '../../types';
import { AI_STORAGE_KEYS } from '../../constants';
import { secureStorage } from '../../utils/secureStorage';

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
  return (await secureStorage.getItem<ChatSession[]>(AI_STORAGE_KEYS.CHAT_SESSIONS)) || [];
};

export const saveSessionMessages = async (sessionId: string, messages: ChatMessage[]): Promise<void> => {
  await ensureInitialized();
  await secureStorage.setItem(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`, messages);
};

export const getSessionMessages = async (sessionId: string): Promise<ChatMessage[]> => {
  await ensureInitialized();
  return (await secureStorage.getItem<ChatMessage[]>(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`)) || [];
};

export const clearSessionMessages = async (sessionId: string): Promise<void> => {
  await ensureInitialized();
  secureStorage.removeItem(`${AI_STORAGE_KEYS.RECENT_MESSAGES}_${sessionId}`);
  secureStorage.removeItem(`${AI_STORAGE_KEYS.ARCHIVED_MESSAGES}_${sessionId}`);
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
  
  const sessions = await getSessions();
  const filtered = sessions.filter(s => s.id !== sessionId);
  
  await saveSessions(filtered);
  await clearSessionMessages(sessionId);
};

export const getSession = async (sessionId: string): Promise<ChatSessionWithMessages | null> => {
  await ensureInitialized();
  
  const sessions = await getSessions();
  const session = sessions.find(s => s.id === sessionId);
  
  if (!session) return null;
  
  const messages = await getSessionMessages(sessionId);
  
  return {
    ...session,
    messages
  };
};

export const addMessage = async (sessionId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>): Promise<ChatMessage> => {
  await ensureInitialized();
  
  const messages = await getSessionMessages(sessionId);
  
  const newMessage: ChatMessage = {
    id: generateId(),
    ...message,
    timestamp: new Date().toISOString()
  };
  
  messages.push(newMessage);
  await saveSessionMessages(sessionId, messages);
  
  await updateSession(sessionId, {
    messageCount: messages.length
  });
  
  return newMessage;
};

export const updateMessage = async (sessionId: string, messageId: string, updates: Partial<ChatMessage>): Promise<ChatMessage | null> => {
  await ensureInitialized();
  
  const messages = await getSessionMessages(sessionId);
  const index = messages.findIndex(m => m.id === messageId);
  
  if (index === -1) return null;
  
  messages[index] = {
    ...messages[index],
    ...updates
  };
  
  await saveSessionMessages(sessionId, messages);
  return messages[index];
};

export const deleteMessage = async (sessionId: string, messageId: string): Promise<void> => {
  await ensureInitialized();
  
  const messages = await getSessionMessages(sessionId);
  const filtered = messages.filter(m => m.id !== messageId);
  
  await saveSessionMessages(sessionId, filtered);
  
  await updateSession(sessionId, {
    messageCount: filtered.length
  });
};

export interface AISettings {
  [key: string]: unknown,
}

export const saveAISettings = async (settings: AISettings): Promise<void> => {
  await ensureInitialized();
  await secureStorage.setItem(AI_STORAGE_KEYS.SETTINGS, settings);
};

export const getAISettings = async (): Promise<AISettings> => {
  await ensureInitialized();
  return (await secureStorage.getItem<AISettings>(AI_STORAGE_KEYS.SETTINGS)) || {};
};

export const clearAISettings = async (): Promise<void> => {
  await ensureInitialized();
  secureStorage.removeItem(AI_STORAGE_KEYS.SETTINGS);
};
