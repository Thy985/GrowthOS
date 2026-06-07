import React from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, AppDispatch } from '../../../app/store';
import { runCoachAnalysis } from '../store/coachSlice';

const CoachHeader: React.FC = React.memo(function CoachHeader() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const lastAnalyzedAt = useSelector((state: RootState) => state.coach.lastAnalyzedAt);
  const isAnalyzing = useSelector((state: RootState) => state.coach.isAnalyzing);

  const handleRefresh = () => {
    dispatch(runCoachAnalysis());
  };

  const relativeTime = (() => {
    if (!lastAnalyzedAt) return null;
    const diff = Date.now() - new Date(lastAnalyzedAt).getTime();
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
        disabled={isAnalyzing}
        className="px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-medium hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAnalyzing ? t('coach.analyzing', '分析中...') : t('coach.retry', '重新分析')}
      </button>
    </div>
  );
});

export default CoachHeader;