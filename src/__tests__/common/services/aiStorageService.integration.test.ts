/**
 * aiStorageService 集成测试
 */

import {
  saveLLMConfig,
  getLLMConfig,
  clearLLMConfig,
  saveAISettings,
  getAISettings,
  createSession,
  getSessions,
  getSession,
  getSessionMessages,
  addMessage,
  updateMessage,
  deleteMessage,
  deleteSession,
  __setAIStorageRepositoriesForTest,
  __resetAIStorageRepositoryForTest,
} from '../../../common/services/aiStorageService';
import { createTestRepository } from './_helpers';
import type { ReadWriteRepository } from '../../../common/repositories/repository';
import type { LLMConfig, ChatSession } from '../../../types';
import type { AISettings } from '../../../common/services/aiStorageService';

interface StoredChatMessage {
  id: string,
  sessionId: string,
  role: 'user' | 'assistant' | 'system' | 'tool',
  content: string,
  timestamp: string,
  tokens?: number,
}

let llmRepo: ReadWriteRepository<LLMConfig & { id: string }>;
let settingsRepo: ReadWriteRepository<AISettings & { id: string }>;
let sessionRepo: ReadWriteRepository<ChatSession>;
let messageRepo: ReadWriteRepository<StoredChatMessage>;

beforeEach(() => {
  __resetAIStorageRepositoryForTest();
  llmRepo = createTestRepository<LLMConfig & { id: string }>();
  settingsRepo = createTestRepository<AISettings & { id: string }>();
  sessionRepo = createTestRepository<ChatSession>();
  messageRepo = createTestRepository<StoredChatMessage>();
  __setAIStorageRepositoriesForTest({
    llmConfig: llmRepo,
    aiSettings: settingsRepo,
    session: sessionRepo,
    message: messageRepo,
  });
});

afterEach(() => {
  __resetAIStorageRepositoryForTest();
});

const sampleConfig: LLMConfig = {
  provider: 'openai',
  apiKey: 'sk-test',
  model: 'gpt-4o',
  temperature: 0.7,
  maxTokens: 1000,
};

describe('aiStorageService (Step 2: split backends)', () => {
  describe('LLMConfig (LocalStorage-style singleton)', () => {
    it('saveLLMConfig → getLLMConfig round-trips', async () => {
      await saveLLMConfig(sampleConfig);
      const got = await getLLMConfig();
      expect(got).toEqual(sampleConfig);
    });

    it('getLLMConfig returns null when unset', async () => {
      expect(await getLLMConfig()).toBeNull();
    });

    it('clearLLMConfig removes it', async () => {
      await saveLLMConfig(sampleConfig);
      await clearLLMConfig();
      expect(await getLLMConfig()).toBeNull();
    });
  });

  describe('AISettings (LocalStorage-style singleton)', () => {
    it('saveAISettings → getAISettings round-trips', async () => {
      await saveAISettings({ theme: 'dark', temperature: 0.5 });
      expect(await getAISettings()).toEqual({ theme: 'dark', temperature: 0.5 });
    });

    it('returns {} when unset', async () => {
      expect(await getAISettings()).toEqual({});
    });
  });

  describe('ChatSession lifecycle', () => {
    it('createSession + getSessions', async () => {
      const s = await createSession('First');
      expect(s.id).toBeTruthy();
      expect(s.messageCount).toBe(0);
      const all = await getSessions();
      expect(all).toHaveLength(1);
      expect(all[0].id).toBe(s.id);
    });

    it('getSessions returns sorted by updatedAt desc', async () => {
      const a = await createSession('A');
      await new Promise((r) => setTimeout(r, 2));
      const b = await createSession('B');
      const all = await getSessions();
      expect(all[0].id).toBe(b.id);
      expect(all[1].id).toBe(a.id);
    });

    it('deleteSession cascades to messages', async () => {
      const s = await createSession('Test');
      await addMessage(s.id, { role: 'user', content: 'hi' });
      expect(await messageRepo.getAll()).toHaveLength(1);

      await deleteSession(s.id);
      expect(await sessionRepo.getAll()).toHaveLength(0);
      expect(await messageRepo.getAll()).toHaveLength(0);
    });
  });

  describe('ChatMessage lifecycle', () => {
    let sessionId: string;

    beforeEach(async () => {
      const s = await createSession('S');
      sessionId = s.id;
    });

    it('addMessage stamps id+timestamp and bumps session.messageCount', async () => {
      const m = await addMessage(sessionId, { role: 'user', content: 'hello' });
      expect(m.id).toBeTruthy();
      expect(m.timestamp).toBeTruthy();

      const session = await getSession(sessionId);
      expect(session?.messageCount).toBe(1);
    });

    it('getSessionMessages returns sorted by timestamp asc', async () => {
      await addMessage(sessionId, { role: 'user', content: 'first' });
      await new Promise((r) => setTimeout(r, 2));
      await addMessage(sessionId, { role: 'assistant', content: 'second' });
      const msgs = await getSessionMessages(sessionId);
      expect(msgs).toHaveLength(2);
      expect(msgs[0].content).toBe('first');
      expect(msgs[1].content).toBe('second');
    });

    it('updateMessage mutates content', async () => {
      const m = await addMessage(sessionId, { role: 'user', content: 'old' });
      const updated = await updateMessage(sessionId, m.id, { content: 'new' });
      expect(updated?.content).toBe('new');
    });

    it('updateMessage returns null for foreign message', async () => {
      const m = await addMessage(sessionId, { role: 'user', content: 'x' });
      const updated = await updateMessage('wrong-session', m.id, { content: 'new' });
      expect(updated).toBeNull();
    });

    it('deleteMessage removes and decrements messageCount', async () => {
      const m = await addMessage(sessionId, { role: 'user', content: 'x' });
      await deleteMessage(sessionId, m.id);
      const session = await getSession(sessionId);
      expect(session?.messageCount).toBe(0);
      expect(session?.messages).toHaveLength(0);
    });
  });
});
