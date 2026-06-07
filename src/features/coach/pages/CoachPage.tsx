import React, { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, AppDispatch } from '../../../app/store';
import CoachHeader from '../components/CoachHeader';
import CoachSummarySection from '../components/CoachSummarySection';
import InsightPanel from '../components/InsightPanel';
import RecommendationPanel from '../components/RecommendationPanel';
import { runCoachAnalysis } from '../store/coachSlice';
import { selectIsCoachCacheValid } from '../utils/coachSelectors';

const CoachPage: React.FC = React.memo(function CoachPage() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const diagnosis = useSelector((state: RootState) => state.coach.diagnosis);
  const isCacheValid = useSelector(selectIsCoachCacheValid);
  const experiences = useSelector((state: RootState) => state.experiences.experiences);
  const isLoading = useSelector((state: RootState) => state.experiences.isLoading);

  useEffect(() => {
    if (!isCacheValid && experiences.length > 0 && !isLoading) {
      dispatch(runCoachAnalysis());
    }
  }, [isCacheValid, experiences.length, isLoading, dispatch]);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (experiences.length === 0) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <CoachHeader />
        <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center">
          <p className="text-4xl mb-3">🧠</p>
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            {t('coach.emptyTitle', '等待你的第一条经历')}
          </h2>
          <p className="text-sm text-gray-400">
            {t('coach.emptyMessage', '记录第一条经历后，成长教练会为你生成诊断。')}
          </p>
        </section>
      </div>
    );
  }

  if (!diagnosis) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <CoachHeader />
        <div className="animate-pulse space-y-4">
          <div className="h-32 bg-gray-200 rounded-2xl" />
          <div className="h-48 bg-gray-200 rounded-2xl" />
          <div className="h-40 bg-gray-200 rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <CoachHeader />
      <CoachSummarySection />
      <InsightPanel />
      <RecommendationPanel />
    </div>
  );
});

export default CoachPage;
