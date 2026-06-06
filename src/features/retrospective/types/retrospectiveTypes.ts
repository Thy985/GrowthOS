// retrospectiveTypes - 复盘向导视图类型

export type WizardStep = 'capabilities' | 'retrospective' | 'experiences' | 'preview';

export interface WizardStepConfig {
  key: WizardStep;
  label: string;
  stepNumber: number;
}

export interface CapabilityImpact {
  capabilityId: string;
  capabilityName: string;
  oldLevel: number;
  newLevel: number;
  change: number;
  reason: string;
}

export interface RetrospectiveWizardData {
  capabilitiesUsed: string[];
  whatWentWell: string[];
  whatWentWrong: string[];
  nextTime: string[];
  experiences: WizardExperience[];
  impacts: CapabilityImpact[];
}

export interface WizardExperience {
  event: string;
  reflection?: string;
  principle?: string;
  capabilityLinks: WizardCapabilityLink[];
}

export interface WizardCapabilityLink {
  capabilityId: string;
  contribution: number;
}

export const INITIAL_WIZARD_DATA: RetrospectiveWizardData = {
  capabilitiesUsed: [],
  whatWentWell: [],
  whatWentWrong: [],
  nextTime: [],
  experiences: [],
  impacts: [],
};

export const WIZARD_STEPS: WizardStepConfig[] = [
  { key: 'capabilities', label: '选择能力', stepNumber: 1 },
  { key: 'retrospective', label: '自由回顾', stepNumber: 2 },
  { key: 'experiences', label: '提炼经验', stepNumber: 3 },
  { key: 'preview', label: '确认变化', stepNumber: 4 },
];

export type WizardAction =
  | { type: 'SET_CAPABILITIES'; payload: string[] }
  | { type: 'SET_WHAT_WENT_WELL'; payload: string[] }
  | { type: 'SET_WHAT_WENT_WRONG'; payload: string[] }
  | { type: 'SET_NEXT_TIME'; payload: string[] }
  | { type: 'SET_EXPERIENCES'; payload: WizardExperience[] }
  | { type: 'SET_IMPACTS'; payload: CapabilityImpact[] }
  | { type: 'RESET' };

export function wizardReducer(
  state: RetrospectiveWizardData,
  action: WizardAction,
): RetrospectiveWizardData {
  switch (action.type) {
    case 'SET_CAPABILITIES':
      return { ...state, capabilitiesUsed: action.payload };
    case 'SET_WHAT_WENT_WELL':
      return { ...state, whatWentWell: action.payload };
    case 'SET_WHAT_WENT_WRONG':
      return { ...state, whatWentWrong: action.payload };
    case 'SET_NEXT_TIME':
      return { ...state, nextTime: action.payload };
    case 'SET_EXPERIENCES':
      return { ...state, experiences: action.payload };
    case 'SET_IMPACTS':
      return { ...state, impacts: action.payload };
    case 'RESET':
      return INITIAL_WIZARD_DATA;
    default:
      return state;
  }
}
