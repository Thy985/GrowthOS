import { configureStore } from '@reduxjs/toolkit';
import aiReducer, {
  setCurrentSession,
  addLocalMessage,
  updateStreamingMessage,
  clearStreaming,
  clearError,
  loadAIConfig,
  createSession,
} from '../../store/slices/aiSlice';
import type { ChatSession, ChatMessage, LLMConfig } from '../../types';

jest.mock('../../common/services/aiStorageService', () => ({
  getLLMConfig: jest.fn().mockResolvedValue(null),
  saveLLMConfig: jest.fn().mockResolvedValue(undefined),
  getSessions: jest.fn().mockResolvedValue([]),
  createSession: jest.fn().mockResolvedValue({
    id: 'test-session-1',
    title: 'Test Session',
    createdAt: '2024-01-01T00:00:00.000Z',
    updatedAt: '2024-01-01T00:00:00.000Z',
    messageCount: 0,
  }),
  getSessionMessages: jest.fn().mockResolvedValue([]),
  addMessage: jest.fn().mockResolvedValue({
    id: 'msg-1',
    role: 'user',
    content: 'Test message',
    timestamp: '2024-01-01T00:00:00.000Z',
  }),
}));

jest.mock('../../common/services/agentOrchestrator', () => ({
  getAgent: jest.fn().mockReturnValue({
    setConfig: jest.fn().mockResolvedValue(undefined),
    sendMessage: jest.fn().mockResolvedValue('AI response'),
  }),
}));

describe('AI Slice', () => {
  const createTestStore = () =>
    configureStore({
      reducer: {
        ai: aiReducer,
      },
    });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const store = createTestStore();
      const state = store.getState().ai;

      expect(state.config).toBeNull();
      expect(state.currentSession).toBeNull();
      expect(state.sessions).toEqual([]);
      expect(state.messages).toEqual({});
      expect(state.isLoading).toBe(false);
      expect(state.isStreaming).toBe(false);
      expect(state.streamingContent).toBe('');
      expect(state.error).toBeNull();
    });
  });

  describe('synchronous actions', () => {
    it('should set current session', () => {
      const store = createTestStore();
      const session: ChatSession = {
        id: 'test-session',
        title: 'Test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        messageCount: 0,
      };

      store.dispatch(setCurrentSession(session));
      expect(store.getState().ai.currentSession).toEqual(session);
    });

    it('should add local message to current session', () => {
      const store = createTestStore();
      const session: ChatSession = {
        id: 'test-session',
        title: 'Test',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        messageCount: 0,
      };

      store.dispatch(setCurrentSession(session));

      const message: ChatMessage = {
        id: 'msg-1',
        role: 'user',
        content: 'Hello',
        timestamp: '2024-01-01T00:00:00.000Z',
      };

      store.dispatch(addLocalMessage(message));

      const state = store.getState().ai;
      expect(state.messages['test-session']).toHaveLength(1);
      expect(state.messages['test-session'][0]).toEqual(message);
    });

    it('should update streaming message', () => {
      const store = createTestStore();

      store.dispatch(updateStreamingMessage('Partial response...'));

      const state = store.getState().ai;
      expect(state.isStreaming).toBe(true);
      expect(state.streamingContent).toBe('Partial response...');
    });

    it('should clear streaming state', () => {
      const store = createTestStore();

      store.dispatch(updateStreamingMessage('Some response'));
      store.dispatch(clearStreaming());

      const state = store.getState().ai;
      expect(state.isStreaming).toBe(false);
      expect(state.streamingContent).toBe('');
    });

    it('should clear error', () => {
      const store = createTestStore();
      
      store.dispatch(loadAIConfig.rejected(
        new Error('Test error'),
        'request-id',
        undefined,
        'Test error'
      ));
      
      expect(store.getState().ai.error).toBe('Test error');
      
      store.dispatch(clearError());
      expect(store.getState().ai.error).toBeNull();
    });
  });

  describe('async thunks', () => {
    it('should handle loadAIConfig.pending', async () => {
      const store = createTestStore();
      
      store.dispatch(loadAIConfig.pending('request-id'));
      
      expect(store.getState().ai.isLoading).toBe(true);
    });

    it('should handle loadAIConfig.fulfilled', async () => {
      const store = createTestStore();
      const config: LLMConfig = {
        provider: 'openai',
        apiKey: 'test-key',
        model: 'gpt-4',
        temperature: 0.7,
        maxTokens: 1000,
      };

      store.dispatch(loadAIConfig.fulfilled(
        { config, sessions: [] },
        'request-id'
      ));

      const state = store.getState().ai;
      expect(state.isLoading).toBe(false);
      expect(state.config).toEqual(config);
      expect(state.sessions).toEqual([]);
    });

    it('should handle loadAIConfig.rejected', () => {
      const store = createTestStore();

      store.dispatch(loadAIConfig.rejected(
        new Error('Failed to load config'),
        'request-id',
        undefined,
        'Failed to load config'
      ));

      const state = store.getState().ai;
      expect(state.isLoading).toBe(false);
      expect(state.error).toBe('Failed to load config');
    });

    it('should handle createSession.fulfilled', async () => {
      const store = createTestStore();
      const session: ChatSession = {
        id: 'new-session',
        title: 'New Session',
        createdAt: '2024-01-01T00:00:00.000Z',
        updatedAt: '2024-01-01T00:00:00.000Z',
        messageCount: 0,
      };

      store.dispatch(createSession.fulfilled(session, 'request-id', 'New Session'));

      const state = store.getState().ai;
      expect(state.sessions).toContainEqual(session);
      expect(state.currentSession).toEqual(session);
    });
  });
});
