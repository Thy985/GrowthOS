import React, { useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';

import type { AppDispatch } from '../../../app/store';
import type {
  RootState,
  Capability,
  CapabilitiesState,
  ExperiencesState,
} from '../../../shared/types';
import { addExperience } from '../store/experienceSlice';

interface FormData {
  event: string;
  reflection: string;
  principle: string;
  confidence: number;
  selectedCapabilityIds: string[];
}

const NewExperiencePage = React.memo(function NewExperiencePage() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();

  const { isLoading, error } = useSelector(
    (state: RootState) => state.experiences as ExperiencesState,
  );
  const capabilities = useSelector(
    (state: RootState) => (state.capabilities as CapabilitiesState).capabilities,
  );

  const [currentStep, setCurrentStep] = useState<number>(0);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);
  const [formError, setFormError] = useState<string>('');

  const [formData, setFormData] = useState<FormData>({
    event: '',
    reflection: '',
    principle: '',
    confidence: 0.5,
    selectedCapabilityIds: [],
  });

  const STEPS = [
    { title: t('experiences.step1Title'), description: t('experiences.step1Desc') },
    { title: t('experiences.step2Title'), description: t('experiences.step2Desc') },
    { title: t('experiences.step3Title'), description: t('experiences.step3Desc') },
  ];

  // Redirect after successful submission
  useEffect(() => {
    if (isSubmitted && !isLoading) {
      const timer = setTimeout(() => {
        navigate('/experiences');
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isSubmitted, isLoading, navigate]);

  const handleChange = useCallback(
    (field: keyof FormData, value: string | number | string[]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (formError) setFormError('');
    },
    [formError],
  );

  const toggleCapability = useCallback((capabilityId: string) => {
    setFormData((prev) => ({
      ...prev,
      selectedCapabilityIds: prev.selectedCapabilityIds.includes(capabilityId)
        ? prev.selectedCapabilityIds.filter((id) => id !== capabilityId)
        : [...prev.selectedCapabilityIds, capabilityId],
    }));
  }, []);

  const validateStep = useCallback((): boolean => {
    if (currentStep === 0 && !formData.event.trim()) {
      setFormError(t('experiences.eventRequiredError'));
      return false;
    }
    return true;
  }, [currentStep, formData.event, t]);

  const handleNext = useCallback(() => {
    if (!validateStep()) return;
    if (currentStep < STEPS.length - 1) {
      setCurrentStep((prev) => prev + 1);
    }
  }, [currentStep, validateStep, STEPS.length]);

  const handleBack = useCallback(() => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  }, [currentStep]);

  const handleSubmit = useCallback(() => {
    if (!formData.event.trim()) {
      setFormError(t('experiences.eventRequiredError'));
      return;
    }

    const capabilityLinks = formData.selectedCapabilityIds.map((capId) => ({
      capabilityId: capId,
      contribution: 0.5,
    }));

    dispatch(
      addExperience({
        userId: 'current-user',
        event: formData.event.trim(),
        reflection: formData.reflection.trim() || undefined,
        principle: formData.principle.trim() || undefined,
        confidence: formData.confidence,
        occurredAt: new Date().toISOString(),
        capabilityLinks: capabilityLinks.length > 0 ? capabilityLinks : undefined,
      }),
    );

    setIsSubmitted(true);
  }, [dispatch, formData, t]);

  // Completion animation
  if (isSubmitted) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4">
        <div className="animate-bounce mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center">
            <svg
              className="w-10 h-10 text-green-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
        </div>
        <h2 className="text-2xl font-bold text-text-primary mb-2">
          {t('experiences.experienceRecorded')}
        </h2>
        <p className="text-text-secondary text-center">{t('experiences.growthForward')}</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4 sm:p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-text-primary mb-2">
          {t('experiences.recordNewExperience')}
        </h1>
        <p className="text-text-secondary">{t('experiences.structuredReflection')}</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-between mb-8">
        {STEPS.map((step, index) => (
          <div key={step.title} className="flex items-center flex-1">
            {/* Step circle */}
            <div className="flex flex-col items-center">
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${
                  index < currentStep
                    ? 'bg-green-500 text-white'
                    : index === currentStep
                      ? 'bg-green-500 text-white'
                      : 'bg-border-DEFAULT text-text-secondary'
                }`}
              >
                {index < currentStep ? (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={`text-xs mt-1 hidden sm:block ${
                  index <= currentStep ? 'text-green-600 font-medium' : 'text-text-muted'
                }`}
              >
                {step.title}
              </span>
            </div>

            {/* Connector line */}
            {index < STEPS.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 ${
                  index < currentStep ? 'bg-green-500' : 'bg-border-DEFAULT'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Error message */}
      {(error || formError) && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {formError || error}
        </div>
      )}

      {/* Step content */}
      <div className="bg-surface rounded-xl shadow-md border border-border-subtle p-6">
        {/* Step 1: Event */}
        {currentStep === 0 && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">
              {t('experiences.step1Title')}
            </h2>
            <p className="text-sm text-text-secondary mb-4">{t('experiences.step1Desc')}</p>
            <textarea
              value={formData.event}
              onChange={(e) => handleChange('event', e.target.value)}
              placeholder={t('experiences.eventPlaceholder')}
              rows={6}
              required
              className="w-full px-4 py-3 border border-border-strong rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-text-primary placeholder-text-muted"
            />
          </div>
        )}

        {/* Step 2: Reflection */}
        {currentStep === 1 && (
          <div>
            <h2 className="text-xl font-semibold text-text-primary mb-1">
              {t('experiences.step2Title')}
            </h2>
            <p className="text-sm text-text-secondary mb-4">{t('experiences.step2Desc')}</p>
            <textarea
              value={formData.reflection}
              onChange={(e) => handleChange('reflection', e.target.value)}
              placeholder={t('experiences.reflectionPlaceholder')}
              rows={6}
              className="w-full px-4 py-3 border border-border-strong rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none text-text-primary placeholder-text-muted"
            />
          </div>
        )}

        {/* Step 3: Principle + confidence + capability links */}
        {currentStep === 2 && (
          <div className="space-y-6">
            {/* Principle */}
            <div>
              <h2 className="text-xl font-semibold text-text-primary mb-1">
                {t('experiences.step3Title')}
              </h2>
              <p className="text-sm text-text-secondary mb-4">{t('experiences.step3Desc')}</p>
              <input
                type="text"
                value={formData.principle}
                onChange={(e) => handleChange('principle', e.target.value)}
                placeholder={t('experiences.principlePlaceholder')}
                className="w-full px-4 py-3 border border-border-strong rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-text-primary placeholder-text-muted"
              />
            </div>

            {/* Confidence slider */}
            {formData.principle.trim() && (
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  {t('experiences.confidence')}：{Math.round(formData.confidence * 100)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={Math.round(formData.confidence * 100)}
                  onChange={(e) => handleChange('confidence', Number(e.target.value) / 100)}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-green-500"
                />
                <div className="flex justify-between text-xs text-text-muted mt-1">
                  <span>{t('experiences.uncertain')}</span>
                  <span>{t('experiences.veryCertain')}</span>
                </div>
              </div>
            )}

            {/* Capability multi-select */}
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                {t('experiences.linkCapabilities')}
              </label>
              <p className="text-xs text-text-muted mb-3">
                {t('experiences.capabilityContribution')}
              </p>
              {capabilities.length === 0 ? (
                <p className="text-sm text-text-muted italic">{t('experiences.noCapabilitiesYet')}</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {capabilities.map((cap: Capability) => {
                    const isSelected = formData.selectedCapabilityIds.includes(cap.id);
                    return (
                      <button
                        key={cap.id}
                        type="button"
                        onClick={() => toggleCapability(cap.id)}
                        className={`px-3 py-1.5 text-sm rounded-full border transition-colors ${
                          isSelected
                            ? 'bg-green-100 border-green-500 text-green-700'
                            : 'bg-surface border-border-strong text-text-secondary hover:border-green-300 hover:bg-green-50'
                        }`}
                      >
                        {isSelected && <span className="mr-1">✓</span>}
                        {cap.name}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t border-border-subtle">
          <button
            type="button"
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-5 py-2.5 rounded-lg font-medium transition-colors ${
              currentStep === 0
                ? 'text-text-disabled cursor-not-allowed'
                : 'text-text-primary bg-surface-muted hover:bg-border-subtle'
            }`}
          >
            {t('common.previous')}
          </button>

          {currentStep < STEPS.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
            >
              {t('common.next')}
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={isLoading}
              className="px-5 py-2.5 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? t('common.submitting') : t('common.submit')}
            </button>
          )}
        </div>
      </div>
    </div>
  );
});

export default NewExperiencePage;
