import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';

const RecordList = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoods, setSelectedMoods] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  
  const { records, tags } = useSelector(state => state.growth);
  
  const allTags = tags;
  const allMoods = ['很好', '一般', '不太好'];
  
  // 处理搜索和过滤
  const filteredRecords = useMemo(() => {
    let filtered = records;
    
    // 搜索过滤
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(record => {
        return (
          (record.activity && record.activity.toLowerCase().includes(searchLower)) ||
          (record.learning && record.learning.toLowerCase().includes(searchLower)) ||
          (record.reflection && record.reflection.toLowerCase().includes(searchLower)) ||
          (record.tags && record.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      });
    }
    
    // 情绪过滤
    if (selectedMoods.length > 0) {
      filtered = filtered.filter(record => selectedMoods.includes(record.mood));
    }
    
    // 标签过滤
    if (selectedTags.length > 0) {
      filtered = filtered.filter(record => {
        if (!record.tags || record.tags.length === 0) return false;
        return selectedTags.some(tag => record.tags.includes(tag));
      });
    }
    
    // 日期范围过滤
    if (dateRange.start && dateRange.end) {
      const startDate = new Date(dateRange.start);
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      
      filtered = filtered.filter(record => {
        const recordDate = new Date(record.createdAt);
        return recordDate >= startDate && recordDate <= endDate;
      });
    }
    
    return filtered;
  }, [records, searchTerm, selectedMoods, selectedTags, dateRange]);
  
  // 处理情绪选择
  const toggleMood = (mood) => {
    setSelectedMoods(prev => 
      prev.includes(mood) 
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };
  
  // 处理标签选择
  const toggleTag = (tag) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };
  
  // 清除所有过滤
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMoods([]);
    setSelectedTags([]);
    setDateRange({ start: '', end: '' });
  };
  
  // 格式化日期
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // 获取情绪颜色
  const getMoodColor = (mood) => {
    switch (mood) {
      case '很好':
        return 'bg-green-100 text-green-800';
      case '一般':
        return 'bg-yellow-100 text-yellow-800';
      case '不太好':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // 高亮搜索结果
  const highlightSearchTerm = (text) => {
    if (!text || !searchTerm) return text;
    
    const searchLower = searchTerm.toLowerCase();
    const textLower = text.toLowerCase();
    
    if (textLower.includes(searchLower)) {
      const index = textLower.indexOf(searchLower);
      const before = text.substring(0, index);
      const match = text.substring(index, index + searchTerm.length);
      const after = text.substring(index + searchTerm.length);
      
      return (
        <>
          {before}
          <span className="bg-yellow-200 font-medium">{match}</span>
          {after}
        </>
      );
    }
    
    return text;
  };
  
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">记录列表</h1>
        {(searchTerm || selectedMoods.length > 0 || selectedTags.length > 0 || dateRange.start || dateRange.end) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors w-full sm:w-auto"
          >
            清除过滤
          </button>
        )}
      </div>
      
      {/* 搜索和过滤区域 */}
      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        {/* 搜索框 */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="搜索记录..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>
        
        {/* 时间范围过滤 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">开始日期</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">结束日期</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>
        
        {/* 情绪过滤 */}
        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">情绪状态</h3>
          <div className="flex flex-wrap gap-2">
            {allMoods.map(mood => (
              <button
                key={mood}
                onClick={() => toggleMood(mood)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedMoods.includes(mood) 
                    ? `${getMoodColor(mood)} border-2 border-current` 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
        
        {/* 标签过滤 */}
        {allTags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">标签</h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedTags.includes(tag) 
                      ? 'bg-green-100 text-green-800 border-2 border-green-500' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {/* 记录计数 */}
      <div className="text-sm text-gray-600">
        显示 {filteredRecords.length} 条记录
      </div>
      
      {/* 记录列表 */}
      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            没有找到符合条件的记录
          </div>
        ) : (
          filteredRecords.map(record => (
            <div key={record.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getMoodColor(record.mood)}`}>
                    {record.mood}
                  </span>
                  <p className="text-sm text-gray-500">{formatDate(record.createdAt)}</p>
                </div>
              </div>
              
              {record.activity && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">做了什么</h4>
                  <p className="text-gray-600">{highlightSearchTerm(record.activity)}</p>
                </div>
              )}
              
              {record.learning && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">学了什么</h4>
                  <p className="text-gray-600">{highlightSearchTerm(record.learning)}</p>
                </div>
              )}
              
              {record.reflection && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">反思</h4>
                  <p className="text-gray-600">{highlightSearchTerm(record.reflection)}</p>
                </div>
              )}
              
              {record.tags && record.tags.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1">
                    {record.tags.map(tag => (
                      <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecordList;
