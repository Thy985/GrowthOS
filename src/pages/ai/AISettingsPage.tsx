import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import type { RootState, AppDispatch, LLMConfig, LLMProvider } from '../../types';
import { loadAIConfig, saveAIConfig, clearError } from '../../store/slices/aiSlice';
import { DEFAULT_LLM_CONFIGS, LLM_PROVIDERS } from '../../constants';

const AISettingsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { config, isLoading, error } = useSelector((state: RootState) => state.ai);
  
  const [provider, setProvider] = useState<LLMProvider>('openai');
  const [apiKey, setApiKey] = useState('');
  const [baseUrl, setBaseUrl] = useState('');
  const [model, setModel] = useState('');
  const [temperature, setTemperature] = useState(0.7);
  const [maxTokens, setMaxTokens] = useState(1000);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    dispatch(loadAIConfig());
  }, [dispatch]);

  useEffect(() => {
    if (config) {
      setProvider(config.provider);
      setApiKey(config.apiKey);
      setBaseUrl(config.baseUrl || '');
      setModel(config.model);
      setTemperature(config.temperature);
      setMaxTokens(config.maxTokens);
    } else {
      // 加载默认配置
      const defaultConfig = DEFAULT_LLM_CONFIGS['openai'];
      setProvider('openai');
      setBaseUrl(defaultConfig.baseUrl || '');
      setModel(defaultConfig.model);
      setTemperature(defaultConfig.temperature);
      setMaxTokens(defaultConfig.maxTokens);
    }
  }, [config]);

  const handleProviderChange = (newProvider: LLMProvider) => {
    setProvider(newProvider);
    const defaultConfig = DEFAULT_LLM_CONFIGS[newProvider];
    setBaseUrl(defaultConfig.baseUrl || '');
    setModel(defaultConfig.model);
    setTemperature(defaultConfig.temperature);
    setMaxTokens(defaultConfig.maxTokens);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!apiKey.trim()) {
      alert('请输入 API Key');
      return;
    }
    
    const newConfig: LLMConfig = {
      provider,
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim() || undefined,
      model: model.trim(),
      temperature,
      maxTokens
    };
    
    await dispatch(saveAIConfig(newConfig));
    alert('配置已保存！');
  };

  const handleClear = () => {
    if (confirm('确定要清除配置吗？')) {
      setApiKey('');
      setBaseUrl('');
      // 可以添加清除逻辑
    }
  };

  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">AI 设置</h1>
      
      {error && (
        <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
          {error}
          <button 
            onClick={() => dispatch(clearError())}
            className="ml-2 text-sm underline"
          >
            关闭
          </button>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Provider 选择 */}
        <div>
          <label className="block text-sm font-medium mb-2">LLM 提供商</label>
          <div className="grid grid-cols-2 gap-3">
            {LLM_PROVIDERS.map(p => (
              <button
                key={p.value}
                type="button"
                onClick={() => handleProviderChange(p.value as LLMProvider)}
                className={`p-3 border rounded-lg flex items-center gap-2 transition-colors ${
                  provider === p.value 
                    ? 'bg-blue-50 border-blue-500' 
                    : 'hover:bg-gray-50'
                }`}
              >
                <span className="text-2xl">{p.icon}</span>
                <div className="text-left">
                  <div className="font-medium">{p.label}</div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* API Key */}
        <div>
          <label className="block text-sm font-medium mb-2">API Key</label>
          <div className="relative">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              className="w-full p-3 border rounded-lg pr-12"
              placeholder="请输入 API Key"
            />
            <button
              type="button"
              onClick={() => setShowKey(!showKey)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
            >
              {showKey ? '🙈' : '👁️'}
            </button>
          </div>
        </div>

        {/* Base URL (可选) */}
        <div>
          <label className="block text-sm font-medium mb-2">Base URL (可选)</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="自定义 API 地址"
          />
        </div>

        {/* Model */}
        <div>
          <label className="block text-sm font-medium mb-2">模型</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="w-full p-3 border rounded-lg"
            placeholder="模型名称"
          />
        </div>

        {/* 高级设置 */}
        <div className="border-t pt-6">
          <h3 className="text-lg font-medium mb-4">高级设置</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Temperature: {temperature}
              </label>
              <input
                type="range"
                min="0"
                max="2"
                step="0.1"
                value={temperature}
                onChange={(e) => setTemperature(parseFloat(e.target.value))}
                className="w-full"
              />
              <p className="text-xs text-gray-500 mt-1">
                较低的值会使输出更确定，较高的值会使输出更有创意
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Max Tokens: {maxTokens}
              </label>
              <input
                type="number"
                min="256"
                max="8192"
                value={maxTokens}
                onChange={(e) => setMaxTokens(parseInt(e.target.value))}
                className="w-full p-3 border rounded-lg"
              />
            </div>
          </div>
        </div>

        {/* 操作按钮 */}
        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-blue-500 text-white py-3 px-4 rounded-lg hover:bg-blue-600 disabled:opacity-50"
          >
            {isLoading ? '保存中...' : '保存配置'}
          </button>
          <button
            type="button"
            onClick={handleClear}
            className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            清除
          </button>
        </div>
      </form>

      {/* 说明 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">使用说明</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• API Key 会被加密保存在本地</li>
          <li>• 数据不会上传到第三方服务器（除 LLM API 调用外）</li>
          <li>• 可以随时在设置中清除配置</li>
        </ul>
      </div>
    </div>
  );
};

export default AISettingsPage;
