import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, AppDispatch } from '../../../app/store';
import CoachHeader from '../components/CoachHeader';
import CoachSummarySection from '../components/CoachSummarySection';
import CompletedGrowth from '../components/CompletedGrowth';
import EmptyStateChecklist from '../components/EmptyStateChecklist';
import InsightPanel from '../components/InsightPanel';
import OtherRecommendations from '../components/OtherRecommendations';
import TopRecommendationCard from '../components/TopRecommendationCard';
import { runCoachAnalysis } from '../store/coachSlice';

const CoachPage: React.FC = React.memo(function CoachPage() {
  const dispatch = useDispatch<AppDispatch>();
  const diagnosis = useSelector((state: RootState) => state.coach.diagnosis);
  const experiences = useSelector((state: RootState) => state.experiences.experiences);
  const isLoading = useSelector(
    (state: RootState) =>
      state.experiences.isLoading || state.capabilities.isLoading || state.projects.isLoading,
  );

  useEffect(() => {
    if (!diagnosis && experiences.length > 0 && !isLoading) {
      dispatch(runCoachAnalysis());
    }
  }, [diagnosis, experiences.length, isLoading, dispatch]);

  // Check for empty state — all three data types must be absent
  const hasCapabilities = useSelector(
    (state: RootState) => state.capabilities.capabilities.length > 0,
  );
  const hasRetrospectives = useSelector((state: RootState) =>
    state.projects.projects.some((p) => p.retrospective),
  );

  const isEmpty = experiences.length === 0 && !hasCapabilities && !hasRetrospectives;

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

  if (isEmpty) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6">
        <EmptyStateChecklist
          hasCapabilities={hasCapabilities}
          hasExperiences={experiences.length > 0}
          hasRetrospectives={hasRetrospectives}
        />
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

  const recommendations = diagnosis.recommendations;
  const topRec = recommendations.find((r) => r.status !== 'completed' && r.status !== 'dismissed');
  const otherRecs = recommendations.filter(
    (r) => r !== topRec && r.status !== 'completed' && r.status !== 'dismissed',
  );
  const completedRecs = recommendations.filter((r) => r.status === 'completed');

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
      <CoachHeader />
      <CoachSummarySection />
      <InsightPanel />
      {topRec && <TopRecommendationCard rec={topRec} />}
      <OtherRecommendations recs={otherRecs} />
      <CompletedGrowth completedRecs={completedRecs} />
    </div>
  );
});

export default CoachPage;
