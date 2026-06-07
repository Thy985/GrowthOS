import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, AppDispatch } from '../../../app/store';
import { runCoachAnalysis } from '../store/coachSlice';

const CoachHeader: React.FC = React.memo(function CoachHeader() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const lastGeneratedAt = useSelector((state: RootState) => state.coach.lastGeneratedAt);
  const isLoading = useSelector(
    (state: RootState) => state.coach.diagnosis === null && state.coach.lastGeneratedAt === null,
  );

  const handleRefresh = () => {
    dispatch(runCoachAnalysis());
  };

  const relativeTime = (() => {
    if (!lastGeneratedAt) return null;
    const diff = Date.now() - new Date(lastGeneratedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('coach.justNow', '刚刚');
    if (minutes < 60) return t('coach.minutesAgo', '{{minutes}} 分钟前', { minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('coach.hoursAgo', '{{hours}} 小时前', { hours });
    const days = Math.floor(hours / 24);
    return t('coach.daysAgo', '{{days}} 天前', { days });
  })();

  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-xl font-bold text-gray-900">{t('coach.pageTitle', 'AI 成长教练')}</h1>
        {relativeTime && (
          <p className="text-xs text-gray-400 mt-1">
            {t('coach.lastUpdated', '上次更新：{{time}}', { time: relativeTime })}
          </p>
        )}
      </div>
      <button
        onClick={handleRefresh}
        disabled={isLoading}
        className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isLoading ? t('coach.analyzing', '分析中...') : t('coach.refresh', '刷新分析')}
      </button>
    </div>
  );
});

export default CoachHeader;
