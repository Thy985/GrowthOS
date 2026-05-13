import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AIState, LLMConfig, ChatSession, ChatMessage } from '../../types';
import { DEFAULT_LLM_CONFIGS } from '../../constants';
import * as aiStorage from '../../common/services/aiStorageService';
import { getAgent } from '../../common/services/agentOrchestrator';

const initialState: AIState = {
  config: null,
  currentSession: null,
  sessions: [],
  isLoading: false,
  isStreaming: false,
  error: null
};

// 异步 action：加载配置
export const loadAIConfig = createAsyncThunk(
  'ai/loadConfig',
  async () => {
    const config = await aiStorage.getLLMConfig();
    const sessions = aiStorage.getSessions();
    return { config, sessions };
  }
);

// 异步 action：保存配置
export const saveAIConfig = createAsyncThunk(
  'ai/saveConfig',
  async (config: LLMConfig, { rejectWithValue }) => {
    try {
      await aiStorage.saveLLMConfig(config);
      const agent = getAgent();
      await agent.setConfig(config);
      return config;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '保存失败');
    }
  }
);

// 异步 action：创建会话
export const createSession = createAsyncThunk(
  'ai/createSession',
  async (title: string) => {
    return aiStorage.createSession(title);
  }
);

// 异步 action：加载会话消息
export const loadSessionMessages = createAsyncThunk(
  'ai/loadSessionMessages',
  async (sessionId: string) => {
    return aiStorage.getSessionMessages(sessionId);
  }
);

// 异步 action：发送消息
export const sendMessage = createAsyncThunk(
  'ai/sendMessage',
  async (
    { sessionId, content }: { sessionId: string; content: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const agent = getAgent();
      
      // 先添加用户消息
      const userMessage = aiStorage.addMessage(sessionId, {
        role: 'user',
        content
      });
      
      // 更新 UI
      dispatch(addLocalMessage(userMessage));
      
      // 获取回复
      let fullResponse = '';
      
      await agent.sendMessage(sessionId, content, (chunk) => {
        fullResponse += chunk;
        dispatch(updateStreamingMessage(fullResponse));
      });
      
      return { userMessage, assistantResponse: fullResponse };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : '发送失败');
    }
  }
);

const aiSlice = createSlice({
  name: 'ai',
  initialState,
  reducers: {
    setCurrentSession: (state, action: PayloadAction<ChatSession | null>) => {
      state.currentSession = action.payload;
    },
    addLocalMessage: (state, action: PayloadAction<ChatMessage>) => {
      // 消息会在会话数据中处理，这里主要是即时反馈
    },
    updateStreamingMessage: (state, action: PayloadAction<string>) => {
      state.isStreaming = true;
    },
    clearStreaming: (state) => {
      state.isStreaming = false;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // 加载配置
      .addCase(loadAIConfig.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadAIConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload.config;
        state.sessions = action.payload.sessions;
        if (action.payload.sessions.length > 0) {
          state.currentSession = action.payload.sessions[0];
        }
      })
      .addCase(loadAIConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 保存配置
      .addCase(saveAIConfig.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(saveAIConfig.fulfilled, (state, action) => {
        state.isLoading = false;
        state.config = action.payload;
      })
      .addCase(saveAIConfig.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 创建会话
      .addCase(createSession.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createSession.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessions.unshift(action.payload);
        state.currentSession = action.payload;
      })
      .addCase(createSession.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // 发送消息
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        state.isLoading = false;
        state.isStreaming = false;
        // 刷新会话列表
        state.sessions = aiStorage.getSessions();
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.isLoading = false;
        state.isStreaming = false;
        state.error = action.payload as string;
      });
  }
});

export const { 
  setCurrentSession, 
  addLocalMessage, 
  updateStreamingMessage, 
  clearStreaming, 
  clearError 
} = aiSlice.actions;

export default aiSlice.reducer;
