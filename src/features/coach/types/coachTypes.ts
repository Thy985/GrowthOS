export interface Insight {
  type: 'stale' | 'growth' | 'pattern' | 'warning';
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
}

export interface CoachDiagnosis {
  summary: string;
  insights: Insight[];
  recommendations: Recommendation[];
  generatedAt: string;
}

export interface CoachState {
  diagnosis: CoachDiagnosis | null;
  lastGeneratedAt: string | null;
}
