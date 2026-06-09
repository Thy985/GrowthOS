import type { RootState } from '../../../app/store';

export interface CoachAction {
  id: string;
  label: string;
  route: string;
  category: 'project' | 'experience' | 'capability' | 'principle' | 'goal';
  buildRoute?: (params: Record<string, string>) => string;
  isCompleted?: (state: RootState, params: Record<string, string>) => boolean;
}

export const coachActionRegistry: Record<string, CoachAction> = {
  review_project: {
    id: 'review_project',
    label: '去复盘',
    route: '/projects',
    category: 'project',
    buildRoute: (params) =>
      params.projectId
        ? `/projects/${params.projectId}/retrospect`
        : '/projects',
    isCompleted: (state, params) => {
      const project = state.projects.projects.find(
        (p) => p.id === params.projectId,
      );
      return !!project?.retrospective;
    },
  },
  record_experience: {
    id: 'record_experience',
    label: '去记录',
    route: '/experiences/new',
    category: 'experience',
    buildRoute: (params) =>
      params.capabilityId
        ? `/experiences/new?capability=${params.capabilityId}`
        : '/experiences/new',
  },
  manage_capability: {
    id: 'manage_capability',
    label: '去管理',
    route: '/capabilities',
    category: 'capability',
  },
  review_experiences: {
    id: 'review_experiences',
    label: '去回顾',
    route: '/experiences',
    category: 'experience',
  },
  apply_principle: {
    id: 'apply_principle',
    label: '去实践',
    route: '/principles',
    category: 'principle',
  },
  complete_project: {
    id: 'complete_project',
    label: '完成项目',
    route: '/projects',
    category: 'project',
  },
  pause_project: {
    id: 'pause_project',
    label: '暂停项目',
    route: '/projects',
    category: 'project',
  },
  create_goal: {
    id: 'create_goal',
    label: '建立目标',
    route: '/goals/new',
    category: 'goal',
  },
};