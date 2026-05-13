import type { LLMConfig, ChatMessage, ChatSession } from '../../types';
import { AI_SYSTEM_PROMPT } from '../../constants';
import { createLLMProvider } from './llmProvider';
import * as aiStorage from './aiStorageService';
import { executeTool } from './aiTools';

export class AgentOrchestrator {
  private config: LLMConfig | null = null;
  
  constructor() {
    // 从存储加载配置
    this.loadConfig();
  }
  
  async loadConfig() {
    this.config = await aiStorage.getLLMConfig();
  }
  
  async setConfig(config: LLMConfig) {
    this.config = config;
    await aiStorage.saveLLMConfig(config);
  }
  
  async hasConfig() {
    await this.loadConfig();
    return !!this.config?.apiKey;
  }
  
  // 创建或获取会话
  async getOrCreateSession(): Promise<ChatSession> {
    let sessions = aiStorage.getSessions();
    if (sessions.length > 0) {
      return sessions[0];
    }
    return aiStorage.createSession('我的成长对话');
  }
  
  // 发送消息
  async sendMessage(
    sessionId: string,
    content: string,
    onChunk?: (chunk: string) => void
  ): Promise<string> {
    if (!this.config) {
      throw new Error('请先配置 LLM');
    }
    
    const provider = createLLMProvider(this.config);
    
    // 获取会话历史
    const sessionData = aiStorage.getSessionMessages(sessionId);
    let messages = sessionData.messages;
    
    // 添加上下文（系统提示词）
    if (messages.length === 0) {
      messages = [{
        id: '',
        role: 'system',
        content: AI_SYSTEM_PROMPT,
        timestamp: new Date().toISOString()
      }];
    }
    
    // 添加用户消息
    const userMessage = aiStorage.addMessage(sessionId, {
      role: 'user',
      content
    });
    
    // 构建发送给 LLM 的消息
    const llmMessages = [...messages, userMessage];
    
    // 调用 LLM
    const response = await provider.chat(llmMessages, onChunk);
    
    // 保存回复
    aiStorage.addMessage(sessionId, {
      role: 'assistant',
      content: response
    });
    
    return response;
  }
  
  // 执行工具调用
  async executeToolCall(
    sessionId: string,
    toolName: string,
    params: Record<string, any> = {}
  ) {
    const result = await executeTool(toolName, params);
    
    // 将工具结果作为工具消息添加到对话
    aiStorage.addMessage(sessionId, {
      role: 'tool',
      content: JSON.stringify(result)
    });
    
    return result;
  }
  
  // 分析用户当前状态并提供建议（非聊天模式）
  async getSmartSuggestions(): Promise<Array<{
    title: string;
    description: string;
    type: 'record' | 'goal' | 'tree' | 'general';
  }>> {
    // 直接调用工具
    const result = await executeTool('suggestNextStep');
    if (result.success && result.data.length > 0) {
      return result.data;
    }
    return [];
  }
}

// 单例
let agentInstance: AgentOrchestrator | null = null;

export const getAgent = () => {
  if (!agentInstance) {
    agentInstance = new AgentOrchestrator();
  }
  return agentInstance;
};
