import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchReminders, addReminder, updateReminder, deleteReminder } from '../../store/slices/reminderSlice';
import { type RootState, type AppDispatch } from '../../store';

const Reminders: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const reminders = useSelector((state: RootState) => state.reminders.reminders);
  const isLoading = useSelector((state: RootState) => state.reminders.isLoading);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    time: '09:00',
  });

  useEffect(() => {
    void dispatch(fetchReminders());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    void dispatch(addReminder({
      title: formData.title,
      description: formData.description,
      date: formData.date,
      time: formData.time,
    }));
    setFormData({
      title: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      time: '09:00',
    });
    setShowForm(false);
  };

  const handleToggle = (id: string, isCompleted: boolean) => {
    void dispatch(updateReminder({ id, updates: { isCompleted: !isCompleted } }));
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('reminders.confirmDelete', '确定要删除这个提醒吗？'))) {
      void dispatch(deleteReminder(id));
    }
  };

  return (
    <div className="main">
      <div className="header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="heading-1">{t('reminders.title', '提醒')}</h1>
          <p className="body-large text-secondary">{t('reminders.subtitle', '管理您的日常提醒')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('common.cancel', '取消') : t('reminders.addReminder', '添加提醒')}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('reminders.newReminder', '新提醒')}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('reminders.title', '标题')}
              </label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('reminders.titlePlaceholder', '提醒标题')}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('reminders.description', '描述')}
              </label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('reminders.descriptionPlaceholder', '提醒描述')}
                rows={2}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('reminders.time', '时间')}
              </label>
              <input
                type="time"
                className="input"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {t('reminders.create', '创建提醒')}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('reminders.allReminders', '所有提醒')}</h3>
        {reminders.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {reminders.map((reminder) => (
              <div
                key={reminder.id}
                style={{
                  padding: '16px',
                  background: reminder.isCompleted ? 'var(--color-gray-50)' : 'var(--color-surface)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                }}
              >
                <input
                  type="checkbox"
                  checked={reminder.isCompleted}
                  onChange={() => handleToggle(reminder.id, reminder.isCompleted)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
                <div style={{ flex: 1 }}>
                  <h4 style={{
                    fontSize: '16px',
                    fontWeight: '500',
                    marginBottom: '4px',
                    textDecoration: reminder.isCompleted ? 'line-through' : 'none',
                    color: reminder.isCompleted ? 'var(--color-text-muted)' : 'var(--color-text-primary)',
                  }}>
                    {reminder.title}
                  </h4>
                  {reminder.description && (
                    <p className="body-small" style={{ marginBottom: '4px' }}>{reminder.description}</p>
                  )}
                  <span className="caption">{reminder.time}</span>
                </div>
                <button
                  className="btn btn-ghost"
                  onClick={() => handleDelete(reminder.id)}
                  style={{ color: 'var(--color-error)' }}
                >
                  {t('common.delete', '删除')}
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>⏰</div>
            <h3 className="heading-4">{t('reminders.noReminders', '暂无提醒')}</h3>
            <p className="body-small">{t('reminders.noRemindersDescription', '点击上方按钮添加您的第一个提醒')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Reminders;
