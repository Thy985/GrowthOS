// RetrospectiveWizard - 复盘向导主容器
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useCallback, useReducer, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import type { RootState, Project } from '../../../shared/types';
import { updateCapability } from '../../capabilities/store/capabilitySlice';
import { addExperience } from '../../experiences/store/experienceSlice';
import { updateProject } from '../../projects/store/projectSlice';
import { analyzeCapabilityImpact } from '../engine/impactAnalysis';
import { INITIAL_WIZARD_DATA, wizardReducer, type WizardStep } from '../types/retrospectiveTypes';

import StepCapabilityPreview from './StepCapabilityPreview';
import StepExtractExperience from './StepExtractExperience';
import StepFreeRetrospective from './StepFreeRetrospective';
import StepSelectCapabilities from './StepSelectCapabilities';
import WizardProgress from './WizardProgress';

interface RetrospectiveWizardProps {
  isOpen: boolean;
  project: Project | null;
  onClose: () => void;
}

const RetrospectiveWizard: React.FC<RetrospectiveWizardProps> = ({ isOpen, project, onClose }) => {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const capabilities = useSelector((state: RootState) => state.capabilities.capabilities);

  const [wizardData, dataDispatch] = useReducer(wizardReducer, INITIAL_WIZARD_DATA);
  const [currentStep, setCurrentStep] = useState<WizardStep>('capabilities');
  const [completedSteps, setCompletedSteps] = useState<WizardStep[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const capabilityNames = useMemo(() => {
    const map = new Map<string, string>();
    for (const cap of capabilities) {
      map.set(cap.id, cap.name);
    }
    return map;
  }, [capabilities]);

  const canGoNext = useCallback((): boolean => {
    switch (currentStep) {
      case 'capabilities':
        return wizardData.capabilitiesUsed.length > 0;
      case 'retrospective':
        return (
          wizardData.whatWentWell.length > 0 ||
          wizardData.whatWentWrong.length > 0 ||
          wizardData.nextTime.length > 0
        );
      case 'experiences':
        return (
          wizardData.experiences.length > 0 && wizardData.experiences.every((e) => e.event.trim())
        );
      default:
        return true;
    }
  }, [currentStep, wizardData]);

  const handleNext = useCallback(() => {
    if (!canGoNext()) return;

    setCompletedSteps((prev) => (prev.includes(currentStep) ? prev : [...prev, currentStep]));

    switch (currentStep) {
      case 'capabilities':
        setCurrentStep('retrospective');
        break;
      case 'retrospective':
        setCurrentStep('experiences');
        break;
      case 'experiences': {
        // 计算能力影响
        const impacts = analyzeCapabilityImpact(
          wizardData.capabilitiesUsed,
          capabilities,
          wizardData.whatWentWell,
          wizardData.whatWentWrong,
        );
        dataDispatch({ type: 'SET_IMPACTS', payload: impacts });
        setCurrentStep('preview');
        break;
      }
      case 'preview':
        break;
    }
  }, [canGoNext, currentStep, wizardData, capabilities]);

  const handleBack = useCallback(() => {
    switch (currentStep) {
      case 'retrospective':
        setCurrentStep('capabilities');
        break;
      case 'experiences':
        setCurrentStep('retrospective');
        break;
      case 'preview':
        setCurrentStep('experiences');
        break;
    }
  }, [currentStep]);

  const handleStepClick = useCallback(
    (step: WizardStep) => {
      if (completedSteps.includes(step)) {
        setCurrentStep(step);
      }
    },
    [completedSteps],
  );

  const handleSubmit = useCallback(async () => {
    if (!project) return;
    setIsSubmitting(true);
    setError(null);

    try {
      // 1. 创建经验
      const expIds: string[] = [];
      for (const exp of wizardData.experiences) {
        const result = await dispatch(
          addExperience({
            userId: project.userId,
            event: exp.event,
            reflection: exp.reflection || undefined,
            principle: exp.principle || undefined,
            projectId: project.id,
            confidence: 0.5,
            occurredAt: new Date().toISOString(),
            capabilityLinks: exp.capabilityLinks.map((link) => ({
              capabilityId: link.capabilityId,
              contribution: link.contribution,
            })),
          }),
        ).unwrap();
        expIds.push(result.experience.id);
      }

      // 2. 更新 Project
      await dispatch(
        updateProject({
          id: project.id,
          retrospective: {
            whatWentWell: wizardData.whatWentWell,
            whatWentWrong: wizardData.whatWentWrong,
            nextTime: wizardData.nextTime,
          },
          capabilitiesUsed: wizardData.capabilitiesUsed,
          experienceGained: expIds,
        }),
      ).unwrap();

      // 3. 更新能力等级
      for (const impact of wizardData.impacts) {
        if (impact.change > 0) {
          try {
            await dispatch(
              updateCapability({
                id: impact.capabilityId,
                currentLevel: impact.newLevel,
              }),
            ).unwrap();
          } catch (capErr) {
            // 能力更新失败不阻断复盘提交
            console.error('Failed to update capability:', impact.capabilityId, capErr);
          }
        }
      }

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '提交失败');
    } finally {
      setIsSubmitting(false);
    }
  }, [project, wizardData, dispatch, onClose]);

  if (!isOpen || !project) return null;

  const stepLabels: Record<WizardStep, string> = {
    capabilities: t('retrospective.step1', '选择能力'),
    retrospective: t('retrospective.step2', '自由回顾'),
    experiences: t('retrospective.step3', '提炼经验'),
    preview: t('retrospective.step4', '确认变化'),
  };

  const stepDescs: Record<WizardStep, string> = {
    capabilities: t('retrospective.step1Desc', '选择本项目中使用到的能力'),
    retrospective: t('retrospective.step2Desc', '回顾做得好的、需要改进的、下次注意的'),
    experiences: t('retrospective.step3Desc', '把复盘发现转化为可复用的经验'),
    preview: t('retrospective.step4Desc', '预览本次复盘对能力的影响'),
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-xl mx-4 p-6 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-lg font-semibold">{t('retrospective.wizardTitle', '项目复盘')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-4">
          {project.name} — {stepLabels[currentStep]}
        </p>

        <WizardProgress
          currentStep={currentStep}
          completedSteps={completedSteps}
          onStepClick={handleStepClick}
        />

        <p className="text-xs text-gray-400 mb-4">{stepDescs[currentStep]}</p>

        {error && <div className="mb-4 p-3 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>}

        {currentStep === 'capabilities' && (
          <StepSelectCapabilities
            selected={wizardData.capabilitiesUsed}
            onChange={(ids) => dataDispatch({ type: 'SET_CAPABILITIES', payload: ids })}
          />
        )}
        {currentStep === 'retrospective' && (
          <StepFreeRetrospective
            whatWentWell={wizardData.whatWentWell}
            whatWentWrong={wizardData.whatWentWrong}
            nextTime={wizardData.nextTime}
            onChange={({ whatWentWell, whatWentWrong, nextTime }) => {
              dataDispatch({ type: 'SET_WHAT_WENT_WELL', payload: whatWentWell });
              dataDispatch({ type: 'SET_WHAT_WENT_WRONG', payload: whatWentWrong });
              dataDispatch({ type: 'SET_NEXT_TIME', payload: nextTime });
            }}
          />
        )}
        {currentStep === 'experiences' && (
          <StepExtractExperience
            experiences={wizardData.experiences}
            capabilitiesUsed={wizardData.capabilitiesUsed}
            capabilityNames={capabilityNames}
            onChange={(exps) => dataDispatch({ type: 'SET_EXPERIENCES', payload: exps })}
          />
        )}
        {currentStep === 'preview' && <StepCapabilityPreview impacts={wizardData.impacts} />}

        <div className="flex gap-3 pt-5 mt-4 border-t border-gray-100">
          {currentStep !== 'capabilities' && (
            <button
              type="button"
              onClick={handleBack}
              disabled={isSubmitting}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {t('common.previous', '上一步')}
            </button>
          )}
          {currentStep !== 'preview' ? (
            <button
              type="button"
              onClick={handleNext}
              disabled={!canGoNext()}
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {t('common.next', '下一步')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex-1 bg-emerald-600 text-white py-2 rounded-lg hover:bg-emerald-700 transition-colors font-medium disabled:opacity-50"
            >
              {isSubmitting
                ? t('common.submitting', '提交中...')
                : t('retrospective.confirmSubmit', '确认提交')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default React.memo(RetrospectiveWizard);
