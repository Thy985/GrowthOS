// WizardProgress - 复盘向导进度条
import React from 'react';

import type { WizardStep } from '../types/retrospectiveTypes';
import { WIZARD_STEPS } from '../types/retrospectiveTypes';

interface WizardProgressProps {
  currentStep: WizardStep;
  completedSteps: WizardStep[];
  onStepClick: (step: WizardStep) => void;
}

const stepOrder: WizardStep[] = ['capabilities', 'retrospective', 'experiences', 'preview'];

const WizardProgress: React.FC<WizardProgressProps> = ({
  currentStep,
  completedSteps,
  onStepClick,
}) => {
  const currentIndex = stepOrder.indexOf(currentStep);

  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {WIZARD_STEPS.map((step, index) => {
        const isCompleted = completedSteps.includes(step.key);
        const isCurrent = step.key === currentStep;
        const isClickable = isCompleted || index < currentIndex;

        return (
          <React.Fragment key={step.key}>
            {index > 0 && (
              <div
                className={`h-0.5 w-10 sm:w-16 ${
                  index <= currentIndex ? 'bg-indigo-500' : 'bg-gray-200'
                }`}
              />
            )}
            <button
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && onStepClick(step.key)}
              className={`flex flex-col items-center gap-1 ${
                isClickable ? 'cursor-pointer' : 'cursor-default'
              }`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium transition-colors ${
                  isCompleted
                    ? 'bg-emerald-500 text-white'
                    : isCurrent
                      ? 'bg-indigo-600 text-white'
                      : 'bg-gray-200 text-gray-400'
                }`}
              >
                {isCompleted ? '✓' : step.stepNumber}
              </div>
              <span
                className={`text-xs whitespace-nowrap ${
                  isCurrent
                    ? 'text-indigo-600 font-medium'
                    : isCompleted
                      ? 'text-emerald-600'
                      : 'text-gray-400'
                }`}
              >
                {step.label}
              </span>
            </button>
          </React.Fragment>
        );
      })}
    </div>
  );
};

export default React.memo(WizardProgress);
