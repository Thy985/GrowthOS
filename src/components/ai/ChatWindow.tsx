import React, { useState, useEffect, useRef, useCallback, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';
import type { RootState, AppDispatch, ChatMessage } from '../../types';
import { loadAIConfig, sendMessage, createSession, loadSessionMessages, clearStreaming } from '../../store/slices/aiSlice';
import * as aiStorage from '../../common/services/aiStorageService';

interface MessageBubbleProps {
  msg: ChatMessage;
}

const MessageBubble = memo<MessageBubbleProps>(({ msg }) => {
  const bubbleClass = msg.role === 'user'
    ? 'bg-blue-500 text-white'
    : msg.role === 'tool'
    ? 'bg-gray-100 text-xs'
    : 'bg-gray-100';

  return (
    <div className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[80%] p-3 rounded-lg ${bubbleClass}`}>
        {msg.role === 'tool' ? (
          <pre className="whitespace-pre-wrap text-xs">{msg.content}</pre>
        ) : (
          <div className="whitespace-pre-wrap">{msg.content}</div>
        )}
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

export const ChatWindow: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { config, currentSession, isLoading, isStreaming, error } = useSelector((state: RootState) => state.ai);
  
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    dispatch(loadAIConfig());
  }, [dispatch]);

  const loadMessages = useCallback(async () => {
    if (currentSession) {
      const sessionData = await aiStorage.getSessionMessages(currentSession.id);
      setMessages(sessionData.messages);
    }
  }, [currentSession]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamingContent]);

  const handleSend = useCallback(async (e?: React.FormEvent) => {
    e?.preventDefault();
    
    if (!inputValue.trim() || !currentSession) return;
    if (!config?.apiKey) {
      return;
    }
    
    const content = inputValue.trim();
    setInputValue('');
    setStreamingContent('');
    
    const userMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content,
      timestamp: new Date().toISOString()
    };
    setMessages(prev => [...prev, userMsg]);
    
    await dispatch(sendMessage({ sessionId: currentSession.id, content }));
    await loadMessages();
    dispatch(clearStreaming());
    setStreamingContent('');
  }, [inputValue, currentSession, config?.apiKey, dispatch, loadMessages]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }, [handleSend]);

  const handleCancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  if (!config?.apiKey) {
    return (
      <div className="fixed bottom-20 right-4 w-80 h-96 bg-white rounded-lg shadow-2xl border flex flex-col z-50">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-bold">AI 成长导师</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">×</button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl mb-4">🤖</div>
          <p className="text-gray-600 mb-4">
            开始使用 AI 成长导师前，请先配置 LLM API
          </p>
          <Link
            to="/ai-settings"
            onClick={onClose}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600"
          >
            去配置
          </Link>
        </div>
      </div>
    );
  }

  const filteredMessages = messages.filter(m => m.role !== 'system');

  return (
    <div className="fixed bottom-20 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border flex flex-col z-50">
      <div className="flex items-center justify-between p-4 border-b">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">🤖</div>
          <div>
            <h2 className="font-bold">AI 成长导师</h2>
            <p className="text-xs text-green-600">{isStreaming ? '思考中...' : '在线'}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">×</button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {filteredMessages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <div className="text-4xl mb-2">👋</div>
            <p>你好！我是你的 AI 成长导师，很高兴能帮助你！</p>
          </div>
        )}
        
        {filteredMessages.map((msg) => (
          <MessageBubble key={msg.id} msg={msg} />
        ))}
        
        {streamingContent && (
          <div className="flex justify-start">
            <div className="max-w-[80%] p-3 rounded-lg bg-gray-100">
              <div className="whitespace-pre-wrap">{streamingContent}</div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      <div className="p-4 border-t">
        <form onSubmit={handleSend} className="flex gap-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="说点什么..."
            rows={1}
            className="flex-1 p-3 border rounded-lg resize-none"
            disabled={isLoading}
          />
          {isLoading && isStreaming ? (
            <button
              type="button"
              onClick={handleCancel}
              className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600"
            >
              停止
            </button>
          ) : (
            <button
              type="submit"
              disabled={isLoading || !inputValue.trim()}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
            >
              发送
            </button>
          )}
        </form>
        {error && (
          <p className="text-sm text-red-500 mt-2">{error}</p>
        )}
      </div>
    </div>
  );
};
