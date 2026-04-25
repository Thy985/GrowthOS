import React, { useState, useRef } from 'react';
import { useGrowth } from '../contexts/GrowthContext';

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
  const { addRecord, getStats, isLoading, error } = useGrowth();
  const feedbackRef = useRef(null);
  const treeRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  // 表单验证
  const validateForm = () => {
    const newErrors = {};
    if (!formData.activity.trim()) {
      newErrors.activity = '请输入做了什么';
    }
    if (!formData.learning.trim()) {
      newErrors.learning = '请输入学了什么';
    }
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // 验证表单
    const validationErrors = validateForm();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // 创建新记录
      const newRecord = {
        ...formData
      };
      
      // 保存记录
      addRecord(newRecord);
      
      // 显示成功消息
      setSuccessMessage('记录保存成功！');
      setTimeout(() => {
        setSuccessMessage('');
      }, 3000);
      
      // 显示反馈动画
      if (feedbackRef.current) {
        // 重置动画
        feedbackRef.current.style.opacity = '0';
        feedbackRef.current.style.animation = 'none';
        // 触发重排
        void feedbackRef.current.offsetWidth;
        // 重新开始动画
        feedbackRef.current.style.animation = 'popIn 0.3s ease';
        feedbackRef.current.style.opacity = '1';
        setTimeout(() => {
          feedbackRef.current.style.opacity = '0';
          feedbackRef.current.style.animation = 'none';
        }, 1000);
      }
      
      // 模拟树的抖动效果
      if (treeRef.current) {
        // 重置动画
        treeRef.current.style.animation = 'none';
        // 触发重排
        void treeRef.current.offsetWidth;
        // 重新开始动画
        treeRef.current.style.animation = 'tree-shake 0.5s ease-in-out';
        setTimeout(() => {
          treeRef.current.style.animation = 'none';
        }, 500);
      }
      
      // 重置表单
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
  };

  return (
    <div>
      <h1 className="page-title">仪表盘</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">成长树预览</h2>
          <div className="h-64 bg-gray-100 rounded flex items-center justify-center" ref={treeRef}>
            <div className="text-center">
              <p className="text-gray-500">成长树可视化区域</p>
              <p className="text-sm text-gray-400 mt-2">使用 #标签 记录日常活动，系统会自动创建对应节点</p>
              <button className="mt-4 btn btn-primary">
                查看完整成长树
              </button>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-medium mb-2">最近添加的节点</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>#Python</span>
                <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded">技能</span>
              </div>
              <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                <span>#阅读</span>
                <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">习惯</span>
              </div>
            </div>
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">日常记录</h2>
          {successMessage && (
            <div className="success-message">
              {successMessage}
            </div>
          )}
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">做了什么</label>
              <input 
                type="text" 
                name="activity"
                className={`input ${errors.activity ? 'border-error' : ''}`} 
                placeholder="今天做了什么... 支持 #标签" 
                value={formData.activity}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.activity && (
                <div className="form-error">{errors.activity}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">学了什么</label>
              <input 
                type="text" 
                name="learning"
                className={`input ${errors.learning ? 'border-error' : ''}`} 
                placeholder="今天学了什么... 支持 #标签" 
                value={formData.learning}
                onChange={handleChange}
                disabled={isSubmitting}
              />
              {errors.learning && (
                <div className="form-error">{errors.learning}</div>
              )}
            </div>
            <div className="form-group">
              <label className="form-label">状态如何</label>
              <select 
                name="mood"
                className="input"
                value={formData.mood}
                onChange={handleChange}
                disabled={isSubmitting}
              >
                <option>很好</option>
                <option>一般</option>
                <option>不太好</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">反思</label>
              <textarea 
                name="reflection"
                className="input" 
                rows="3" 
                placeholder="今天的反思..."
                value={formData.reflection}
                onChange={handleChange}
                disabled={isSubmitting}
              ></textarea>
            </div>
            <button 
              type="submit" 
              className="btn btn-primary w-full" 
              id="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="loading mr-2"></div>
                  提交中...
                </div>
              ) : (
                '提交'
              )}
            </button>
          </form>
          <div ref={feedbackRef} className="feedback-animation">
            +1 经验值
          </div>
          <div className="mt-4 text-sm text-gray-600">
            <p>提示：使用 #标签 可以自动创建或关联成长树节点，例如 #Python #阅读</p>
          </div>
        </div>
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">快速统计</h2>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-gray-600">本周记录</p>
              <p className="text-2xl font-bold">{getStats().weeklyRecords}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">总记录</p>
              <p className="text-2xl font-bold">{getStats().totalRecords}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">成长进度</p>
              <div className="progress-container">
                <div className="progress-bar" style={{ width: `${getStats().growthProgress}%` }}></div>
              </div>
              <p className="text-right mt-1">{getStats().growthProgress}%</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;