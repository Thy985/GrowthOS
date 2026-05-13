import type { LLMConfig, ChatMessage, ChatSession } from '../../types';
import { AI_SYSTEM_PROMPT } from '../../constants';
import { createLLMProvider } from './llmProvider';
import * as aiStorage from './aiStorageService';
import { executeTool } from './aiTools';

export enum AgentState {
  IDLE = 'idle',
  INITIALIZING = 'initializing',
  READY = 'ready',
  PROCESSING = 'processing',
  ERROR = 'error'
}

export class AgentError extends Error {
  constructor(
    message: string,
    public code: string,
    public recoverable: boolean = false
  ) {
    super(message);
    this.name = 'AgentError';
  }
}

export interface AgentStatus {
  state: AgentState;
  lastError?: string;
  lastUpdate: string;
  isReady: boolean;
}

export interface RetryConfig {
  maxRetries: number;
  initialDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2
};

const DEFAULT_TIMEOUT = 60000;

export class AgentOrchestrator {
  private config: LLMConfig | null = null;
  private _state: AgentState = AgentState.IDLE;
  private _lastError: string | undefined;
  private _abortController: AbortController | null = null;

  get state(): AgentState {
    return this._state;
  }

  get status(): AgentStatus {
    return {
      state: this._state,
      lastError: this._lastError,
      lastUpdate: new Date().toISOString(),
      isReady: this._state === AgentState.READY
    };
  }

  private _setState(state: AgentState, error?: string): void {
    this._state = state;
    this._lastError = error;
  }

  async loadConfig(): Promise<void> {
    this._setState(AgentState.INITIALIZING);
    try {
      this.config = await aiStorage.getLLMConfig();
      if (this.config?.apiKey) {
        this._setState(AgentState.READY);
      } else {
        this._setState(AgentState.IDLE);
      }
    } catch (error) {
      this._setState(AgentState.ERROR, error instanceof Error ? error.message : '配置加载失败');
      throw new AgentError('配置加载失败', 'CONFIG_LOAD_ERROR', true);
    }
  }
  
  async setConfig(config: LLMConfig): Promise<void> {
    this._setState(AgentState.INITIALIZING);
    try {
      await aiStorage.saveLLMConfig(config);
      this.config = config;
      this._setState(AgentState.READY);
    } catch (error) {
      this._setState(AgentState.ERROR, error instanceof Error ? error.message : '配置保存失败');
      throw new AgentError('配置保存失败', 'CONFIG_SAVE_ERROR', true);
    }
  }
  
  async hasConfig(): Promise<boolean> {
    await this.loadConfig();
    return !!this.config?.apiKey;
  }

  async getOrCreateSession(): Promise<ChatSession> {
    let sessions = await aiStorage.getSessions();
    if (sessions.length > 0) {
      return sessions[0];
    }
    return await aiStorage.createSession('我的成长对话');
  }

  private async _withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number = DEFAULT_TIMEOUT,
    operationName: string = '操作'
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        reject(new AgentError(`${operationName}超时 (${timeoutMs}ms)`, 'TIMEOUT_ERROR', true));
      }, timeoutMs);

      promise
        .then((result) => {
          clearTimeout(timer);
          resolve(result);
        })
        .catch((error) => {
          clearTimeout(timer);
          reject(error);
        });
    });
  }

  private async _withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig = DEFAULT_RETRY_CONFIG,
    operationName: string = '操作'
  ): Promise<T> {
    let lastError: Error | undefined;
    
    for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < config.maxRetries) {
          const delay = Math.min(
            config.initialDelay * Math.pow(config.backoffMultiplier, attempt),
            config.maxDelay
          );
          console.warn(`${operationName}失败，${delay}ms 后重试 (${attempt + 1}/${config.maxRetries})`);
          await this._sleep(delay);
        }
      }
    }
    
    throw lastError || new Error(`${operationName}失败`);
  }

  private _sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  cancel(): void {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
  }

  async sendMessage(
    sessionId: string,
    content: string,
    onChunk?: (chunk: string) => void,
    options: {
      timeout?: number;
      retryConfig?: RetryConfig;
    } = {}
  ): Promise<string> {
    if (!this.config) {
      throw new AgentError('请先配置 LLM', 'NO_CONFIG', false);
    }

    this._abortController = new AbortController();
    this._setState(AgentState.PROCESSING);
    
    const { timeout = DEFAULT_TIMEOUT, retryConfig = DEFAULT_RETRY_CONFIG } = options;
    const provider = createLLMProvider(this.config);

    try {
      const sessionData = await this._withRetry(
        () => aiStorage.getSessionMessages(sessionId),
        retryConfig,
        '获取会话消息'
      );
      let messages = sessionData.messages;
      
      if (messages.length === 0) {
        messages = [{
          id: '',
          role: 'system',
          content: AI_SYSTEM_PROMPT,
          timestamp: new Date().toISOString()
        }];
      }
      
      await aiStorage.addMessage(sessionId, {
        role: 'user',
        content
      });
      
      const response = await this._withTimeout(
        this._withRetry(
          () => provider.chat(messages, onChunk),
          retryConfig,
          'LLM 请求'
        ),
        timeout,
        'LLM 请求'
      );
      
      await aiStorage.addMessage(sessionId, {
        role: 'assistant',
        content: response
      });
      
      this._setState(AgentState.READY);
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '未知错误';
      this._setState(AgentState.ERROR, errorMessage);
      
      if (error instanceof AgentError) {
        throw error;
      }
      
      throw new AgentError(
        `消息发送失败: ${errorMessage}`,
        'MESSAGE_SEND_ERROR',
        true
      );
    }
  }
  
  async executeToolCall(
    sessionId: string,
    toolName: string,
    params: Record<string, unknown> = {}
  ) {
    try {
      const result = await this._withRetry(
        () => executeTool(toolName, params),
        { ...DEFAULT_RETRY_CONFIG, maxRetries: 1 },
        '工具执行'
      );
      
      await aiStorage.addMessage(sessionId, {
        role: 'tool',
        content: JSON.stringify(result)
      });
      
      return result;
    } catch (error) {
      throw new AgentError(
        `工具执行失败: ${error instanceof Error ? error.message : '未知错误'}`,
        'TOOL_EXECUTION_ERROR',
        false
      );
    }
  }
  
  async getSmartSuggestions(): Promise<Array<{
    title: string;
    description: string;
    type: 'record' | 'goal' | 'tree' | 'general';
  }>> {
    try {
      const result = await this._withRetry(
        () => executeTool('suggestNextStep'),
        { ...DEFAULT_RETRY_CONFIG, maxRetries: 1 },
        '获取建议'
      );
      if (result.success && result.data.length > 0) {
        return result.data;
      }
      return [];
    } catch {
      return [];
    }
  }
}

let agentInstance: AgentOrchestrator | null = null;

export const getAgent = (): AgentOrchestrator => {
  if (!agentInstance) {
    agentInstance = new AgentOrchestrator();
  }
  return agentInstance;
};

export const resetAgent = (): void => {
  if (agentInstance) {
    agentInstance.cancel();
  }
  agentInstance = null;
};
