import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchGoals, addGoal, updateGoal, deleteGoal } from '../../store/slices/goalSlice';
import { type RootState } from '../../store';
import { type Goal } from '../../types';

const Goals: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const goals = useSelector((state: RootState) => state.goals.goals);
  const isLoading = useSelector((state: RootState) => state.goals.isLoading);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    targetDate: '',
    category: 'learning',
  });

  useEffect(() => {
    dispatch(fetchGoals());
  }, [dispatch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addGoal({
      title: formData.title,
      description: formData.description,
      targetDate: formData.targetDate,
      category: formData.category,
      progress: 0,
      status: 'active',
    }));
    setFormData({ title: '', description: '', targetDate: '', category: 'learning' });
    setShowForm(false);
  };

  const handleDelete = (id: string) => {
    if (window.confirm(t('goals.confirmDelete', '确定要删除这个目标吗？'))) {
      dispatch(deleteGoal(id));
    }
  };

  const handleProgressUpdate = (goal: Goal, newProgress: number) => {
    dispatch(updateGoal({
      id: goal.id,
      updates: {
        progress: newProgress,
        status: newProgress >= 100 ? 'completed' : 'active',
      },
    }));
  };

  return (
    <div className="main">
      <div className="header" style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="heading-1">{t('goals.title', '目标')}</h1>
          <p className="body-large text-secondary">{t('goals.subtitle', '设定并追踪您的成长目标')}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? t('common.cancel', '取消') : t('goals.addGoal', '添加目标')}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ padding: '24px', marginBottom: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('goals.newGoal', '新目标')}</h3>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('goals.title', '目标标题')}
              </label>
              <input
                type="text"
                className="input"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder={t('goals.titlePlaceholder', '请输入目标标题')}
                required
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('goals.description', '描述')}
              </label>
              <textarea
                className="input"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder={t('goals.descriptionPlaceholder', '请输入目标描述')}
                rows={3}
              />
            </div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>
                {t('goals.targetDate', '目标日期')}
              </label>
              <input
                type="date"
                className="input"
                value={formData.targetDate}
                onChange={(e) => setFormData({ ...formData, targetDate: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-primary" disabled={isLoading}>
              {t('goals.create', '创建目标')}
            </button>
          </form>
        </div>
      )}

      <div className="card" style={{ padding: '24px' }}>
        <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('goals.activeGoals', '进行中的目标')}</h3>
        {goals.filter(g => g.status === 'active').length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {goals.filter(g => g.status === 'active').map((goal) => (
              <div
                key={goal.id}
                style={{
                  padding: '16px',
                  background: 'var(--color-gray-50)',
                  borderRadius: '12px',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div>
                    <h4 style={{ fontSize: '16px', fontWeight: '600', marginBottom: '4px' }}>{goal.title}</h4>
                    {goal.description && <p className="body-small">{goal.description}</p>}
                  </div>
                  <button
                    className="btn btn-ghost"
                    onClick={() => handleDelete(goal.id)}
                    style={{ color: 'var(--color-error)' }}
                  >
                    {t('common.delete', '删除')}
                  </button>
                </div>
                <div className="progress-bar" style={{ marginBottom: '8px' }}>
                  <div
                    className="progress-bar-fill"
                    style={{
                      width: `${goal.progress}%`,
                      background: 'var(--color-primary-500)',
                    }}
                  />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span className="caption">{goal.progress}%</span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={goal.progress}
                    onChange={(e) => handleProgressUpdate(goal, parseInt(e.target.value))}
                    style={{ width: '150px' }}
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <p className="body-small">{t('goals.noGoals', '暂无进行中的目标')}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Goals;
