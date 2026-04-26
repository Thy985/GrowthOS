import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loadReminders, addReminder, updateReminder, deleteReminder, completeReminder } from '../../store/slices/reminderSlice.ts';
import ErrorBoundary from '../../components/ErrorBoundary.jsx';

const Reminders = () => {
  const dispatch = useDispatch();
  const { reminders, isLoading, error } = useSelector(state => state.reminder);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: ''
  });

  // 加载提醒数据
  useEffect(() => {
    dispatch(loadReminders());
  }, [dispatch]);

  // 处理表单输入变化
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // 处理添加提醒
  const handleAddReminder = useCallback(() => {
    if (formData.title && formData.date && formData.time) {
      if (editingReminder) {
        dispatch(updateReminder({
          ...editingReminder,
          ...formData,
          updatedAt: new Date().toISOString()
        }));
        setEditingReminder(null);
      } else {
        dispatch(addReminder({
          title: formData.title,
          description: formData.description,
          date: formData.date,
          time: formData.time
        }));
      }
      setFormData({ title: '', description: '', date: '', time: '' });
      setShowAddModal(false);
    }
  }, [dispatch, formData, editingReminder]);

  // 处理编辑提醒
  const handleEditReminder = (reminder) => {
    setEditingReminder(reminder);
    setFormData({
      title: reminder.title,
      description: reminder.description,
      date: reminder.date,
      time: reminder.time
    });
    setShowAddModal(true);
  };

  // 处理删除提醒
  const handleDeleteReminder = (reminderId) => {
    if (window.confirm('确定要删除这个提醒吗？')) {
      dispatch(deleteReminder(reminderId));
    }
  };

  // 处理标记提醒为已完成
  const handleCompleteReminder = (reminderId) => {
    dispatch(completeReminder(reminderId));
  };

  // 过滤出未完成的提醒
  const pendingReminders = reminders.filter(reminder => !reminder.isCompleted);
  // 过滤出已完成的提醒
  const completedReminders = reminders.filter(reminder => reminder.isCompleted);

  return (
    <ErrorBoundary>
      <div className="reminders-page">
        <div className="flex justify-between items-center mb-6">
          <h1 className="page-title">提醒</h1>
          <button 
            className="btn btn-primary"
            onClick={() => {
              setEditingReminder(null);
              setFormData({ title: '', description: '', date: '', time: '' });
              setShowAddModal(true);
            }}
          >
            添加提醒
          </button>
        </div>

        {error && (
          <div className="error-message mb-6">
            {error}
          </div>
        )}

        {/* 未完成的提醒 */}
        {pendingReminders.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-medium mb-4">待完成</h2>
            <div className="space-y-4">
              {pendingReminders.map(reminder => (
                <div key={reminder.id} className="reminder-card">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      className="mt-1 mr-3"
                      onChange={() => handleCompleteReminder(reminder.id)}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium">{reminder.title}</h3>
                        <div className="text-sm text-gray-500">
                          {reminder.date} {reminder.time}
                        </div>
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-gray-600 mt-1">{reminder.description}</p>
                      )}
                    </div>
                    <div className="flex space-x-2">
                      <button 
                        className="btn btn-sm btn-outline"
                        onClick={() => handleEditReminder(reminder)}
                      >
                        编辑
                      </button>
                      <button 
                        className="btn btn-sm btn-danger"
                        onClick={() => handleDeleteReminder(reminder.id)}
                      >
                        删除
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 已完成的提醒 */}
        {completedReminders.length > 0 && (
          <div>
            <h2 className="text-lg font-medium mb-4">已完成</h2>
            <div className="space-y-4">
              {completedReminders.map(reminder => (
                <div key={reminder.id} className="reminder-card completed">
                  <div className="flex items-start">
                    <input 
                      type="checkbox" 
                      className="mt-1 mr-3" 
                      checked
                      onChange={() => {}}
                    />
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <h3 className="font-medium line-through">{reminder.title}</h3>
                        <div className="text-sm text-gray-500">
                          {reminder.date} {reminder.time}
                        </div>
                      </div>
                      {reminder.description && (
                        <p className="text-sm text-gray-600 mt-1 line-through">{reminder.description}</p>
                      )}
                    </div>
                    <button 
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDeleteReminder(reminder.id)}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 空状态 */}
        {reminders.length === 0 && !isLoading && (
          <div className="empty-state">
            <p>暂无提醒，点击"添加提醒"按钮创建第一个提醒</p>
          </div>
        )}

        {/* 添加/编辑提醒模态框 */}
        {showAddModal && (
          <div className="modal-overlay">
            <div className="modal-content">
              <h2 className="modal-title">{editingReminder ? '编辑提醒' : '添加提醒'}</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">标题</label>
                  <input 
                    type="text" 
                    name="title" 
                    className="input w-full"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="请输入提醒标题"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">描述</label>
                  <textarea 
                    name="description" 
                    className="input w-full" 
                    rows={3}
                    value={formData.description}
                    onChange={handleInputChange}
                    placeholder="请输入提醒描述"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">日期</label>
                    <input 
                      type="date" 
                      name="date" 
                      className="input w-full"
                      value={formData.date}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">时间</label>
                    <input 
                      type="time" 
                      name="time" 
                      className="input w-full"
                      value={formData.time}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>
              </div>
              <div className="modal-actions">
                <button 
                  className="btn btn-outline"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingReminder(null);
                  }}
                >
                  取消
                </button>
                <button 
                  className="btn btn-primary"
                  onClick={handleAddReminder}
                >
                  {editingReminder ? '更新' : '添加'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  );
};

export default Reminders;