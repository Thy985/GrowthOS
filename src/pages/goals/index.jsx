import React, { useState, useCallback, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { loadGoals, addGoal, updateGoal, deleteGoal, incrementGoalProgress, clearError } from '../../store/slices/goalSlice';
import ErrorBoundary from '../../components/ErrorBoundary';
import { calculateProgress, formatDate, getGoalStatusText, validateGoalForm } from '../../utils/goalUtils';

const Goals = () => {
  const dispatch = useDispatch();
  const { goals, isLoading, error } = useSelector(state => state.goal);
  
  // 表单状态
  const [showAddForm, setShowAddForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [currentGoal, setCurrentGoal] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetValue: '',
    startDate: '',
    endDate: ''
  });
  
  // 错误状态
  const [formErrors, setFormErrors] = useState({});
  
  // 加载目标数据
  useEffect(() => {
    dispatch(loadGoals());
  }, [dispatch]);
  
  // 清除错误
  useEffect(() => {
    if (error) {
      setTimeout(() => {
        dispatch(clearError());
      }, 3000);
    }
  }, [error, dispatch]);
  
  // 处理表单输入变化
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 清除错误
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  }, [formErrors]);
  
  // 表单验证
  const validateForm = useCallback(() => {
    return validateGoalForm(formData);
  }, [formData]);
  
  // 处理添加目标
  const handleAddGoal = useCallback((e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    dispatch(addGoal({
      title: formData.title,
      description: formData.description,
      targetValue: Number(formData.targetValue),
      startDate: formData.startDate,
      endDate: formData.endDate
    }));
    
    // 重置表单
    setFormData({
      title: '',
      description: '',
      targetValue: '',
      startDate: '',
      endDate: ''
    });
    setShowAddForm(false);
  }, [formData, validateForm, dispatch]);
  
  // 处理编辑目标
  const handleEditGoal = useCallback((goal) => {
    setCurrentGoal(goal);
    setFormData({
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue.toString(),
      startDate: goal.startDate.split('T')[0],
      endDate: goal.endDate.split('T')[0]
    });
    setShowEditForm(true);
  }, []);
  
  // 处理更新目标
  const handleUpdateGoal = useCallback((e) => {
    e.preventDefault();
    
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }
    
    if (currentGoal) {
      dispatch(updateGoal({
        id: currentGoal.id,
        title: formData.title,
        description: formData.description,
        targetValue: Number(formData.targetValue),
        startDate: formData.startDate,
        endDate: formData.endDate
      }));
      
      // 重置表单
      setCurrentGoal(null);
      setFormData({
        title: '',
        description: '',
        targetValue: '',
        startDate: '',
        endDate: ''
      });
      setShowEditForm(false);
    }
  }, [formData, validateForm, currentGoal, dispatch]);
  
  // 处理删除目标
  const handleDeleteGoal = useCallback((goalId) => {
    if (window.confirm('确定要删除这个目标吗？')) {
      dispatch(deleteGoal(goalId));
    }
  }, [dispatch]);
  
  // 处理增加目标进度
  const handleIncrementProgress = useCallback((goalId) => {
    const value = prompt('请输入要增加的进度值：');
    if (value && !isNaN(value) && Number(value) > 0) {
      dispatch(incrementGoalProgress({ goalId, value: Number(value) }));
    }
  }, [dispatch]);
  
  return (
    <ErrorBoundary>
      <div className="goals-page">
        <h1 className="page-title">目标管理</h1>
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className="goals-header">
          <button 
            className="btn btn-primary"
            onClick={() => setShowAddForm(!showAddForm)}
          >
            {showAddForm ? '取消' : '添加目标'}
          </button>
        </div>
        
        {showAddForm && (
          <div className="goal-form card">
            <h2 className="text-xl font-semibold mb-4">添加新目标</h2>
            <form onSubmit={handleAddGoal}>
              <div className="form-group">
                <label className="form-label">目标标题</label>
                <input 
                  type="text" 
                  name="title"
                  className={`input ${formErrors.title ? 'border-error' : ''}`} 
                  placeholder="例如：每天学习1小时"
                  value={formData.title}
                  onChange={handleChange}
                />
                {formErrors.title && (
                  <div className="form-error">{formErrors.title}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">目标描述</label>
                <textarea 
                  name="description"
                  className="input" 
                  rows="3" 
                  placeholder="描述你的目标..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">目标值</label>
                <input 
                  type="number" 
                  name="targetValue"
                  className={`input ${formErrors.targetValue ? 'border-error' : ''}`} 
                  placeholder="例如：30"
                  value={formData.targetValue}
                  onChange={handleChange}
                  min="1"
                />
                {formErrors.targetValue && (
                  <div className="form-error">{formErrors.targetValue}</div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">开始日期</label>
                  <input 
                    type="date" 
                    name="startDate"
                    className={`input ${formErrors.startDate ? 'border-error' : ''}`} 
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  {formErrors.startDate && (
                    <div className="form-error">{formErrors.startDate}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">结束日期</label>
                  <input 
                    type="date" 
                    name="endDate"
                    className={`input ${formErrors.endDate ? 'border-error' : ''}`} 
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                  {formErrors.endDate && (
                    <div className="form-error">{formErrors.endDate}</div>
                  )}
                </div>
              </div>
              <button 
                type="submit" 
                className="btn btn-primary w-full mt-4"
                disabled={isLoading}
              >
                {isLoading ? '添加中...' : '添加目标'}
              </button>
            </form>
          </div>
        )}
        
        {showEditForm && currentGoal && (
          <div className="goal-form card">
            <h2 className="text-xl font-semibold mb-4">编辑目标</h2>
            <form onSubmit={handleUpdateGoal}>
              <div className="form-group">
                <label className="form-label">目标标题</label>
                <input 
                  type="text" 
                  name="title"
                  className={`input ${formErrors.title ? 'border-error' : ''}`} 
                  placeholder="例如：每天学习1小时"
                  value={formData.title}
                  onChange={handleChange}
                />
                {formErrors.title && (
                  <div className="form-error">{formErrors.title}</div>
                )}
              </div>
              <div className="form-group">
                <label className="form-label">目标描述</label>
                <textarea 
                  name="description"
                  className="input" 
                  rows="3" 
                  placeholder="描述你的目标..."
                  value={formData.description}
                  onChange={handleChange}
                ></textarea>
              </div>
              <div className="form-group">
                <label className="form-label">目标值</label>
                <input 
                  type="number" 
                  name="targetValue"
                  className={`input ${formErrors.targetValue ? 'border-error' : ''}`} 
                  placeholder="例如：30"
                  value={formData.targetValue}
                  onChange={handleChange}
                  min="1"
                />
                {formErrors.targetValue && (
                  <div className="form-error">{formErrors.targetValue}</div>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="form-group">
                  <label className="form-label">开始日期</label>
                  <input 
                    type="date" 
                    name="startDate"
                    className={`input ${formErrors.startDate ? 'border-error' : ''}`} 
                    value={formData.startDate}
                    onChange={handleChange}
                  />
                  {formErrors.startDate && (
                    <div className="form-error">{formErrors.startDate}</div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">结束日期</label>
                  <input 
                    type="date" 
                    name="endDate"
                    className={`input ${formErrors.endDate ? 'border-error' : ''}`} 
                    value={formData.endDate}
                    onChange={handleChange}
                  />
                  {formErrors.endDate && (
                    <div className="form-error">{formErrors.endDate}</div>
                  )}
                </div>
              </div>
              <div className="flex space-x-2 mt-4">
                <button 
                  type="submit" 
                  className="btn btn-primary flex-1"
                  disabled={isLoading}
                >
                  {isLoading ? '更新中...' : '更新目标'}
                </button>
                <button 
                  type="button" 
                  className="btn btn-secondary"
                  onClick={() => {
                    setShowEditForm(false);
                    setCurrentGoal(null);
                    setFormData({
                      title: '',
                      description: '',
                      targetValue: '',
                      startDate: '',
                      endDate: ''
                    });
                  }}
                >
                  取消
                </button>
              </div>
            </form>
          </div>
        )}
        
        <div className="goals-list">
          <h2 className="text-xl font-semibold mb-4">我的目标</h2>
          {isLoading ? (
            <div className="loading">加载中...</div>
          ) : goals.length === 0 ? (
            <div className="empty-state">
              <p>还没有设置目标，点击"添加目标"按钮开始设置吧！</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {goals.map(goal => (
                <div key={goal.id} className="goal-card card">
                  <div className="goal-header">
                    <h3 className="font-semibold">{goal.title}</h3>
                    <span className={`status-badge ${goal.status}`}>
                      {getGoalStatusText(goal.status)}
                    </span>
                  </div>
                  <p className="goal-description text-gray-600 mb-4">{goal.description}</p>
                  <div className="goal-progress">
                    <div className="flex justify-between mb-1">
                      <span>进度</span>
                      <span>{goal.currentValue}/{goal.targetValue} ({calculateProgress(goal.currentValue, goal.targetValue)}%)</span>
                    </div>
                    <div className="progress-container">
                      <div 
                        className="progress-bar" 
                        style={{ width: `${calculateProgress(goal.currentValue, goal.targetValue)}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className="goal-dates mt-4 text-sm text-gray-500">
                    <p>开始日期：{formatDate(goal.startDate)}</p>
                    <p>结束日期：{formatDate(goal.endDate)}</p>
                  </div>
                  <div className="goal-actions mt-4 flex space-x-2">
                    {goal.status === 'active' && (
                      <button 
                        className="btn btn-sm btn-primary"
                        onClick={() => handleIncrementProgress(goal.id)}
                      >
                        增加进度
                      </button>
                    )}
                    <button 
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleEditGoal(goal)}
                    >
                      编辑
                    </button>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteGoal(goal.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default Goals;
