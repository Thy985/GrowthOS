export type InsightType =
  | 'stale'
  | 'growth'
  | 'pattern'
  | 'warning'
  | 'retrospective'
  | 'trend'
  | 'gap'
  | 'project';

export interface Insight {
  type: InsightType;
  icon: string;
  title: string;
  description: string;
  severity: 'info' | 'notice' | 'important';
}

export type RecommendationStatus =
  | 'pending'
  | 'in_progress'
  | 'completed'
  | 'dismissed';

export interface Recommendation {
  id: string;            // stable ID for lifecycle tracking
  actionId: string;      // key in coachActionRegistry
  actionParams?: Record<string, string>;
  title: string;
  action: string;
  icon: string;
  priority: 'high' | 'medium' | 'low';
  relatedCapability?: string;
  relatedProjectId?: string;
  evidence?: string[];
  status: RecommendationStatus;
  statusUpdatedAt: string;
  sourceRule: string;
  // backward compat for existing RecommendationPanel/Dashboard
  linkTo?: {
    route: string;
    label: string;
  };
}

export interface CoachSummary {
  headline: string;
  highlights: string[];
  concerns: string[];
  nextAction: string;
  completionRate?: {
    completedThisWeek: number;
    totalThisWeek: number;
  };
}

export interface CoachDiagnosis {
  summary: CoachSummary;
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: string;
}

export interface CoachState {
  diagnosis: CoachDiagnosis | null;
  history: CoachDiagnosis[];
  lastAnalyzedAt: string | null;
  isAnalyzing: boolean;
  recommendationStatuses: Record<string, {
    status: RecommendationStatus;
    updatedAt: string;
  }>;
}

export interface InsightGroup {
  type: InsightType;
  label: string;
  icon: string;
  insights: Insight[];
}