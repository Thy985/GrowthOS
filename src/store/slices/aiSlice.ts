import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import type { AIState, LLMConfig, ChatSession, ChatMessage } from '../../types';
import { DEFAULT_LLM_CONFIGS } from '../../constants';
import * as aiStorage from '../../common/services/aiStorageService';
import { getAgent } from '../../common/services/agentOrchestrator';
import { sanitizeUserInput, sanitizeAIOutput } from '../../utils/xssSanitizer';

const initialState: AIState = {
  config: null,
  currentSession: null,
  sessions: [],
  isLoading: false,
  isStreaming: false,
  error: null
};

export const loadAIConfig = createAsyncThunk(
  'ai/loadConfig',
  async () => {
    const config = await aiStorage.getLLMConfig();
    const sessions = await aiStorage.getSessions();
    return { config, sessions };
  }
);

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

export const createSession = createAsyncThunk(
  'ai/createSession',
  async (title: string) => {
    return await aiStorage.createSession(title);
  }
);

export const loadSessionMessages = createAsyncThunk(
  'ai/loadSessionMessages',
  async (sessionId: string) => {
    return await aiStorage.getSessionMessages(sessionId);
  }
);

export const sendMessage = createAsyncThunk(
  'ai/sendMessage',
  async (
    { sessionId, content }: { sessionId: string; content: string },
    { rejectWithValue, dispatch }
  ) => {
    try {
      const sanitizedContent = sanitizeUserInput(content);
      if (!sanitizedContent) {
        return rejectWithValue('消息内容无效');
      }

      const agent = getAgent();
      
      const userMessage = await aiStorage.addMessage(sessionId, {
        role: 'user',
        content: sanitizedContent
      });
      
      dispatch(addLocalMessage(userMessage));
      
      let fullResponse = '';
      
      await agent.sendMessage(sessionId, sanitizedContent, (chunk) => {
        fullResponse += chunk;
        dispatch(updateStreamingMessage(fullResponse));
      });
      
      const sanitizedResponse = sanitizeAIOutput(fullResponse);
      
      await aiStorage.addMessage(sessionId, {
        role: 'assistant',
        content: sanitizedResponse
      });
      
      return { userMessage, assistantResponse: sanitizedResponse };
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
      .addCase(sendMessage.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(sendMessage.fulfilled, (state) => {
        state.isLoading = false;
        state.isStreaming = false;
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
