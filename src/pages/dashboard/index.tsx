import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { fetchRecords } from '../../store/slices/growthSlice';
import { fetchGoals } from '../../store/slices/goalSlice';
import { fetchReminders } from '../../store/slices/reminderSlice';
import { type RootState, type AppDispatch } from '../../store';

const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const records = useSelector((state: RootState) => state.growth.records);
  const goals = useSelector((state: RootState) => state.goals.goals);
  const reminders = useSelector((state: RootState) => state.reminders.reminders);

  useEffect(() => {
    void dispatch(fetchRecords());
    void dispatch(fetchGoals());
    void dispatch(fetchReminders());
  }, [dispatch]);

  const todayRecords = records.filter((r) => {
    const today = new Date();
    const recordDate = new Date(r.createdAt);
    return (
      recordDate.getDate() === today.getDate() &&
      recordDate.getMonth() === today.getMonth() &&
      recordDate.getFullYear() === today.getFullYear()
    );
  });

  const activeGoals = goals.filter((g) => g.status === 'active');
  const upcomingReminders = reminders.filter((r) => !r.isCompleted);

  const getGoalProgress = (goal: typeof goals[0]) => {
    if (goal.targetValue === 0) return 0;
    return Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
  };

  return (
    <div className="main">
      <div className="header" style={{ marginBottom: '32px' }}>
        <h1 className="heading-1">{t('dashboard.title', '仪表板')}</h1>
        <p className="body-large text-secondary">{t('dashboard.subtitle', '查看您的成长概览')}</p>
      </div>

      <div className="grid-stats" style={{ marginBottom: '32px' }}>
        <div className="card card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>📝</span>
            <span className="caption">{t('dashboard.todayRecords', '今日记录')}</span>
          </div>
          <p className="heading-1">{todayRecords.length}</p>
        </div>

        <div className="card card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>📊</span>
            <span className="caption">{t('dashboard.totalRecords', '总记录数')}</span>
          </div>
          <p className="heading-1">{records.length}</p>
        </div>

        <div className="card card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎯</span>
            <span className="caption">{t('dashboard.activeGoals', '进行中的目标')}</span>
          </div>
          <p className="heading-1">{activeGoals.length}</p>
        </div>

        <div className="card card-elevated" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
            <span style={{ fontSize: '24px' }}>⏰</span>
            <span className="caption">{t('dashboard.reminders', '待办提醒')}</span>
          </div>
          <p className="heading-1">{upcomingReminders.length}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('dashboard.recentRecords', '最近记录')}</h3>
          {todayRecords.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {todayRecords.slice(0, 5).map((record) => (
                <div
                  key={record.id}
                  style={{
                    padding: '12px',
                    background: 'var(--color-gray-50)',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ fontSize: '14px', marginBottom: '4px' }}>{record.activity || record.learning}</p>
                  <span className="caption">{new Date(record.createdAt).toLocaleTimeString()}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="body-small">{t('dashboard.noRecords', '暂无记录')}</p>
          )}
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('dashboard.activeGoalsList', '进行中的目标')}</h3>
          {activeGoals.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {activeGoals.slice(0, 5).map((goal) => (
                <div
                  key={goal.id}
                  style={{
                    padding: '12px',
                    background: 'var(--color-gray-50)',
                    borderRadius: '8px',
                  }}
                >
                  <p style={{ fontSize: '14px', marginBottom: '8px' }}>{goal.title}</p>
                  <div className="progress-bar">
                    <div
                      className="progress-bar-fill"
                      style={{
                        width: `${getGoalProgress(goal)}%`,
                        background: 'var(--color-primary-500)',
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="body-small">{t('dashboard.noGoals', '暂无目标')}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
