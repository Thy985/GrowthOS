import React, { useState, useRef, useCallback, memo, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { addRecord } from '../../store/slices/growthSlice';

const Dashboard = () => {
  const [formData, setFormData] = useState({
    activity: '',
    learning: '',
    mood: '很好',
    reflection: ''
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const dispatch = useDispatch();
  const { records, isLoading, error } = useSelector(state => state.growth);
  const feedbackRef = useRef(null);
  const treeRef = useRef(null);

  const calculateStreak = useCallback((records) => {
    if (!records || records.length === 0) return 0;
    
    const sortedRecords = [...records].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (let i = 0; i < 365; i++) {
      const checkDate = new Date(currentDate);
      checkDate.setDate(checkDate.getDate() - i);
      const checkDateStr = checkDate.toISOString().split('T')[0];
      
      const hasRecord = sortedRecords.some(record => {
        const recordDate = new Date(record.createdAt).toISOString().split('T')[0];
        return recordDate === checkDateStr;
      });
      
      if (hasRecord) {
        streak++;
      } else if (i > 0) {
        break;
      }
    }
    
    return streak;
  }, []);

  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);
    
    const twoWeeksAgo = new Date(today);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    
    const thisWeekRecords = records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= weekAgo;
    });
    
    const lastWeekRecords = records.filter(record => {
      const recordDate = new Date(record.createdAt);
      return recordDate >= twoWeeksAgo && recordDate < weekAgo;
    });
    
    const streak = calculateStreak(records);
    
    const moodStats = records.reduce((acc, record) => {
      if (record.mood) {
        acc[record.mood] = (acc[record.mood] || 0) + 1;
      }
      return acc;
    }, {});
    
    const totalRecords = records.length;
    const growthProgress = Math.min(Math.round((totalRecords / 100) * 100), 100);
    
    const weekChange = thisWeekRecords.length - lastWeekRecords.length;
    const weekChangePercent = lastWeekRecords.length > 0 
      ? Math.round((weekChange / lastWeekRecords.length) * 100) 
      : (thisWeekRecords.length > 0 ? 100 : 0);

    return {
      weeklyRecords: thisWeekRecords.length,
      totalRecords,
      growthProgress,
      streak,
      moodStats,
      weekChange,
      weekChangePercent,
      thisWeekRecords,
      lastWeekRecords
    };
  }, [records, calculateStreak]);

  const badges = useMemo(() => {
    const earned = [];
    
    if (stats.totalRecords >= 1) {
      earned.push({ id: 'first_record', name: '初次记录', icon: '🌱', description: '完成第一条记录' });
    }
    if (stats.totalRecords >= 10) {
      earned.push({ id: 'ten_records', name: '十次成长', icon: '🌿', description: '完成10条记录' });
    }
    if (stats.totalRecords >= 50) {
      earned.push({ id: 'fifty_records', name: '稳步前进', icon: '🌳', description: '完成50条记录' });
    }
    if (stats.totalRecords >= 100) {
      earned.push({ id: 'hundred_records', name: '百日成长', icon: '🏆', description: '完成100条记录' });
    }
    if (stats.streak >= 3) {
      earned.push({ id: 'streak_3', name: '连续3天', icon: '🔥', description: '连续记录3天' });
    }
    if (stats.streak >= 7) {
      earned.push({ id: 'streak_7', name: '一周坚持', icon: '⭐', description: '连续记录7天' });
    }
    if (stats.streak >= 30) {
      earned.push({ id: 'streak_30', name: '月度坚持', icon: '💎', description: '连续记录30天' });
    }
    if (stats.weekChangePercent >= 50 && stats.thisWeekRecords.length >= 5) {
      earned.push({ id: 'active_week', name: '活跃周', icon: '🚀', description: '本周记录数增长50%以上' });
    }
    
    return earned;
  }, [stats]);

  const recentActivities = useMemo(() => {
    return stats.thisWeekRecords.slice(0, 5).map(record => ({
      id: record.id,
      text: record.activity || record.learning || '无内容',
      mood: record.mood,
      date: record.createdAt
    }));
  }, [stats.thisWeekRecords]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [errors]);

  const validateForm = useCallback(() => {
    const newErrors = {};
    if (!formData.activity.trim() && !formData.learning.trim()) {
      newErrors.activity = '请输入做了什么或学了什么';
    }
    return newErrors;
  }, [formData]);

  const handleSubmit = useCallback((e) => {
    e.preventDefault();
    
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      const extractTags = (text) => {
        const tagRegex = /#([^\s]+)/g;
        const matches = text.match(tagRegex);
        return matches ? matches.map(tag => tag.substring(1)) : [];
      };
      
      const newRecord = {
        ...formData,
        tags: [...new Set([...extractTags(formData.activity), ...extractTags(formData.learning)])]
      };
      
      dispatch(addRecord(newRecord));
      
      setSuccessMessage('记录保存成功！');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      if (feedbackRef.current) {
        feedbackRef.current.style.opacity = '0';
        feedbackRef.current.style.animation = 'none';
        void feedbackRef.current.offsetWidth;
        feedbackRef.current.style.animation = 'popIn 0.3s ease';
        feedbackRef.current.style.opacity = '1';
        setTimeout(() => {
          feedbackRef.current.style.opacity = '0';
          feedbackRef.current.style.animation = 'none';
        }, 1000);
      }
      
      if (treeRef.current) {
        treeRef.current.style.animation = 'none';
        void treeRef.current.offsetWidth;
        treeRef.current.style.animation = 'tree-shake 0.5s ease-in-out';
        setTimeout(() => {
          treeRef.current.style.animation = 'none';
        }, 500);
      }
      
      setFormData({
        activity: '',
        learning: '',
        mood: '很好',
        reflection: ''
      });
    } catch (err) {
      console.error('保存记录失败:', err);
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, dispatch]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">仪表盘</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">本周记录</p>
              <p className="text-3xl font-bold text-blue-600">{stats.weeklyRecords}</p>
              <p className={`text-sm ${stats.weekChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {stats.weekChange >= 0 ? '+' : ''}{stats.weekChange} ({stats.weekChangePercent}%)
              </p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">连续记录</p>
              <p className="text-3xl font-bold text-orange-600">{stats.streak}</p>
              <p className="text-sm text-gray-400">天</p>
            </div>
            <div className="text-4xl">🔥</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">总记录</p>
              <p className="text-3xl font-bold text-green-600">{stats.totalRecords}</p>
              <p className="text-sm text-gray-400">条</p>
            </div>
            <div className="text-4xl">🌱</div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">成长进度</p>
              <p className="text-3xl font-bold text-purple-600">{stats.growthProgress}%</p>
              <div className="w-24 h-2 bg-gray-200 rounded-full mt-1">
                <div 
                  className="h-full bg-purple-600 rounded-full transition-all"
                  style={{ width: `${stats.growthProgress}%` }}
                ></div>
              </div>
            </div>
            <div className="text-4xl">🎯</div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">快速记录</h2>
            {successMessage && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">做了什么</label>
                  <input 
                    type="text" 
                    name="activity"
                    className={`w-full px-3 py-2 border rounded-md ${errors.activity ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="今天做了什么... 支持 #标签" 
                    value={formData.activity}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                  {errors.activity && (
                    <p className="text-red-500 text-xs mt-1">{errors.activity}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">学了什么</label>
                  <input 
                    type="text" 
                    name="learning"
                    className={`w-full px-3 py-2 border rounded-md ${errors.learning ? 'border-red-500' : 'border-gray-300'}`}
                    placeholder="今天学了什么... 支持 #标签" 
                    value={formData.learning}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">状态如何</label>
                  <div className="flex gap-2">
                    {['很好', '一般', '不太好'].map(mood => (
                      <button
                        key={mood}
                        type="button"
                        onClick={() => setFormData(prev => ({ ...prev, mood }))}
                        className={`flex-1 py-2 px-3 rounded-md transition-colors ${
                          formData.mood === mood 
                            ? mood === '很好' ? 'bg-green-500 text-white' 
                            : mood === '一般' ? 'bg-yellow-500 text-white'
                            : 'bg-red-500 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                        disabled={isSubmitting}
                      >
                        {mood === '很好' ? '😊' : mood === '一般' ? '😐' : '😔'} {mood}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">反思</label>
                  <textarea 
                    name="reflection"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    rows="2" 
                    placeholder="今天的反思..."
                    value={formData.reflection}
                    onChange={handleChange}
                    disabled={isSubmitting}
                  ></textarea>
                </div>
              </div>
              
              <button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md transition-colors disabled:bg-gray-400"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    提交中...
                  </span>
                ) : '提交记录'}
              </button>
            </form>
            <div ref={feedbackRef} className="feedback-animation opacity-0 mt-4 text-center">
              <span className="text-2xl">🎉</span>
              <span className="ml-2 font-medium text-green-600">+1 经验值</span>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6 mt-6">
            <h2 className="text-xl font-semibold mb-4">本周活动</h2>
            {recentActivities.length === 0 ? (
              <p className="text-gray-500 text-center py-8">暂无记录，开始记录你的成长吧！</p>
            ) : (
              <div className="space-y-3">
                {recentActivities.map((activity, index) => (
                  <div key={activity.id || index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="flex-shrink-0">
                      {activity.mood === '很好' ? '😊' : activity.mood === '一般' ? '😐' : '😔'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-800 truncate">{activity.text}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(activity.date).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">成长树预览</h2>
            <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-lg p-8 min-h-[200px] flex items-center justify-center" ref={treeRef}>
              <div className="text-center">
                <div className="text-6xl mb-2">🌳</div>
                <p className="text-gray-500">成长树可视化区域</p>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-2 text-center">
              使用 #标签 记录，系统会自动创建节点
            </p>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">成就徽章</h2>
            {badges.length === 0 ? (
              <p className="text-gray-500 text-center py-4">开始记录来解锁徽章！</p>
            ) : (
              <div className="grid grid-cols-4 gap-2">
                {badges.map(badge => (
                  <div 
                    key={badge.id}
                    className="text-center group relative"
                    title={`${badge.name}: ${badge.description}`}
                  >
                    <div className="text-3xl mb-1">{badge.icon}</div>
                    <p className="text-xs text-gray-600">{badge.name}</p>
                    <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
                      {badge.description}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">情绪分布</h2>
            {Object.keys(stats.moodStats).length === 0 ? (
              <p className="text-gray-500 text-center py-4">暂无数据</p>
            ) : (
              <div className="space-y-3">
                {Object.entries(stats.moodStats).map(([mood, count]) => {
                  const percent = Math.round((count / stats.totalRecords) * 100);
                  const colorClass = mood === '很好' ? 'bg-green-500' 
                    : mood === '一般' ? 'bg-yellow-500' 
                    : 'bg-red-500';
                  const emoji = mood === '很好' ? '😊' 
                    : mood === '一般' ? '😐' 
                    : '😔';
                  
                  return (
                    <div key={mood}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{emoji} {mood}</span>
                        <span className="text-gray-500">{count} ({percent}%)</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full ${colorClass}`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default memo(Dashboard);
