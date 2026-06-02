import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface TutorialProps {
  onClose: () => void,
}

const tutorialSteps = [
  {
    title: '欢迎使用 GrowthOS',
    description: '这是一个帮助你记录个人成长轨迹的应用。',
    icon: '👋',
  },
  {
    title: '记录你的成长',
    description: '每天记录你的心情、想法和学习内容，建立个人成长数据库。',
    icon: '📝',
  },
  {
    title: '设定目标',
    description: '为不同领域设定成长目标，追踪你的进度。',
    icon: '🎯',
  },
  {
    title: '设置提醒',
    description: '设置每日提醒，保持记录的习惯。',
    icon: '⏰',
  },
  {
    title: '开始使用',
    description: '现在你已经了解了基本功能，开始记录你的成长吧！',
    icon: '🚀',
  },
];

const Tutorial: React.FC<TutorialProps> = ({ onClose }) => {
  const { t } = useTranslation();
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  const step = tutorialSteps[currentStep];

  return (
    <div className="modal-overlay">
      <div
        className="modal-content"
        style={{
          maxWidth: '500px',
          textAlign: 'center',
          padding: '32px',
        }}
      >
        <div
          style={{
            fontSize: '64px',
            marginBottom: '24px',
            animation: 'bounce 1s ease-in-out infinite',
          }}
        >
          {step.icon}
        </div>
        <h2
          style={{
            fontSize: '24px',
            fontWeight: '600',
            marginBottom: '16px',
            color: 'var(--color-text-primary)',
          }}
        >
          {step.title}
        </h2>
        <p
          style={{
            fontSize: '16px',
            color: 'var(--color-text-secondary)',
            marginBottom: '32px',
            lineHeight: '1.6',
          }}
        >
          {step.description}
        </p>
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '8px',
            marginBottom: '24px',
          }}
        >
          {tutorialSteps.map((_, index) => (
            <div
              key={index}
              style={{
                width: index === currentStep ? '24px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background:
                  index === currentStep
                    ? 'var(--color-primary-500)'
                    : 'var(--color-gray-200)',
                transition: 'all 0.3s ease',
              }}
            />
          ))}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <button
            className="btn btn-ghost"
            onClick={handleSkip}
            style={{ color: 'var(--color-text-muted)' }}
          >
            {t('tutorial.skip', '跳过')}
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep > 0 && (
              <button className="btn btn-outline" onClick={handlePrevious}>
                {t('common.previous', '上一步')}
              </button>
            )}
            <button className="btn btn-primary" onClick={handleNext}>
              {currentStep === tutorialSteps.length - 1
                ? t('tutorial.start', '开始使用')
                : t('common.next', '下一步')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Tutorial;
