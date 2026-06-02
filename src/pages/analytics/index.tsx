import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { type RootState } from '../../store';

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const records = useSelector((state: RootState) => state.growth.records);
  const goals = useSelector((state: RootState) => state.goals.goals);
  const reminders = useSelector((state: RootState) => state.reminders.reminders);

  const activityData = Object.entries(
    records.reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

  const completedGoals = goals.filter(g => g.status === 'completed').length;
  const activeGoals = goals.filter(g => g.status === 'active').length;
  const completedReminders = reminders.filter(r => r.isCompleted).length;

  return (
    <div className="main">
      <div className="header" style={{ marginBottom: '24px' }}>
        <h1 className="heading-1">{t('analytics.title', '数据分析')}</h1>
        <p className="body-large text-secondary">{t('analytics.subtitle', '了解你的成长趋势')}</p>
      </div>

      <div className="grid-stats" style={{ marginBottom: '32px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <p className="caption">{t('analytics.totalRecords', '总记录数')}</p>
          <p className="heading-2">{records.length}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <p className="caption">{t('analytics.thisWeek', '本周记录')}</p>
          <p className="heading-2">
            {records.filter(r => {
              const date = new Date(r.createdAt);
              const now = new Date();
              const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
              return date >= weekAgo;
            }).length}
          </p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <p className="caption">{t('analytics.completedGoals', '已完成目标')}</p>
          <p className="heading-2">{completedGoals}/{activeGoals}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <p className="caption">{t('analytics.completedReminders', '已完成提醒')}</p>
          <p className="heading-2">{completedReminders}/{reminders.length}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('analytics.activityDistribution', '活动分布')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card" style={{ padding: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('analytics.categoryDistribution', '分类分布')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={activityData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Analytics;
