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

export interface Recommendation {
  icon: string;
  title: string;
  action: string;
  priority: 'high' | 'medium' | 'low';
  relatedCapability?: string;
  relatedProjectId?: string;
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
}

export interface CoachDiagnosis {
  summary: CoachSummary;
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: string;
}

export interface CoachState {
  diagnosis: CoachDiagnosis | null;
  lastGeneratedAt: string | null;
}

export interface InsightGroup {
  type: InsightType;
  label: string;
  icon: string;
  insights: Insight[];
}
