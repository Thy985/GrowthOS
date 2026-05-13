import type { LLMConfig, ChatMessage } from '../../types';

// Provider 接口
export interface LLMProvider {
  config: LLMConfig;
  chat(messages: ChatMessage[], onChunk?: (chunk: string) => void): Promise<string>;
}

// 基础 Provider 类
abstract class BaseLLMProvider implements LLMProvider {
  config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  abstract chat(messages: ChatMessage[], onChunk?: (chunk: string) => void): Promise<string>;
}

// OpenAI Provider
export class OpenAIProvider extends BaseLLMProvider {
  async chat(messages: ChatMessage[], onChunk?: (chunk: string) => void): Promise<string> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: !!onChunk
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API 错误: ${response.status} ${response.statusText}`);
    }

    if (onChunk) {
      // 流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  onChunk(content);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
      
      return fullText;
    } else {
      // 非流式响应
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }
}

// Anthropic Provider
export class AnthropicProvider extends BaseLLMProvider {
  async chat(messages: ChatMessage[], onChunk?: (chunk: string) => void): Promise<string> {
    const url = `${this.config.baseUrl}/messages`;
    
    const systemMessage = messages.find(m => m.role === 'system');
    const nonSystemMessages = messages.filter(m => m.role !== 'system');
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model,
        system: systemMessage?.content,
        messages: nonSystemMessages.map(m => ({ role: m.role, content: m.content })),
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        stream: !!onChunk
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API 错误: ${response.status} ${response.statusText}`);
    }

    if (onChunk) {
      // 流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                if (parsed.type === 'content_block_delta') {
                  const content = parsed.delta?.text;
                  if (content) {
                    fullText += content;
                    onChunk(content);
                  }
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
      
      return fullText;
    } else {
      // 非流式响应
      const data = await response.json();
      return data.content?.[0]?.text || '';
    }
  }
}

// DeepSeek Provider
export class DeepSeekProvider extends BaseLLMProvider {
  async chat(messages: ChatMessage[], onChunk?: (chunk: string) => void): Promise<string> {
    const url = `${this.config.baseUrl}/chat/completions`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.config.apiKey}`
      },
      body: JSON.stringify({
        model: this.config.model,
        messages: messages.map(m => ({ role: m.role, content: m.content })),
        temperature: this.config.temperature,
        max_tokens: this.config.maxTokens,
        stream: !!onChunk
      })
    });

    if (!response.ok) {
      throw new Error(`DeepSeek API 错误: ${response.status} ${response.statusText}`);
    }

    if (onChunk) {
      // 流式响应
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') continue;
              
              try {
                const parsed = JSON.parse(data);
                const content = parsed.choices?.[0]?.delta?.content;
                if (content) {
                  fullText += content;
                  onChunk(content);
                }
              } catch {
                // 忽略解析错误
              }
            }
          }
        }
      }
      
      return fullText;
    } else {
      // 非流式响应
      const data = await response.json();
      return data.choices?.[0]?.message?.content || '';
    }
  }
}

// Provider 工厂函数
export const createLLMProvider = (config: LLMConfig): LLMProvider => {
  switch (config.provider) {
    case 'openai':
      return new OpenAIProvider(config);
    case 'anthropic':
      return new AnthropicProvider(config);
    case 'deepseek':
    case 'custom':
      return new DeepSeekProvider(config);
    default:
      throw new Error(`不支持的 provider: ${config.provider}`);
  }
};
