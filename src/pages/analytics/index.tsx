import React from 'react';
import { useSelector } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { RootState } from '../../store';

const Analytics: React.FC = () => {
  const { t } = useTranslation();
  const records = useSelector((state: RootState) => state.growth.records);

  const moodData = [
    { name: t('mood.great', '很棒'), value: records.filter(r => r.mood === 'great').length, fill: '#10b981' },
    { name: t('mood.okay', '一般'), value: records.filter(r => r.mood === 'okay').length, fill: '#f59e0b' },
    { name: t('mood.notGood', '不好'), value: records.filter(r => r.mood === 'not-good').length, fill: '#ef4444' },
  ];

  const categoryData = Object.entries(
    records.reduce((acc, record) => {
      acc[record.category] = (acc[record.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).map(([name, value]) => ({ name, value }));

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
          <p className="caption">{t('analytics.categories', '分类数')}</p>
          <p className="heading-2">{categoryData.length}</p>
        </div>
        <div className="card" style={{ padding: '24px' }}>
          <p className="caption">{t('analytics.averageMood', '平均心情')}</p>
          <p className="heading-2">
            {moodData.length > 0
              ? moodData.reduce((acc, m) => acc + m.value, 0) / moodData.filter(m => m.value > 0).length || 0
              : 0}
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
        <div className="card" style={{ padding: '24px' }}>
          <h3 className="heading-4" style={{ marginBottom: '16px' }}>{t('analytics.moodDistribution', '心情分布')}</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={moodData}>
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
            <BarChart data={categoryData}>
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
