import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

interface EmptyStateChecklistProps {
  hasCapabilities: boolean;
  hasExperiences: boolean;
  hasRetrospectives: boolean;
}

const EmptyStateChecklist: React.FC<EmptyStateChecklistProps> = React.memo(
  function EmptyStateChecklist({ hasCapabilities, hasExperiences, hasRetrospectives }) {
    const { t } = useTranslation();

    const steps = [
      {
        key: 'capability',
        done: hasCapabilities,
        label: t('coach.emptyState.step1', '创建你的第一个能力'),
        motivation: t('coach.emptyState.motivation1', '定义你想成长的方向'),
        link: '/capabilities',
      },
      {
        key: 'experience',
        done: hasExperiences,
        label: t('coach.emptyState.step2', '记录第一段经历'),
        motivation: t('coach.emptyState.motivation2', '让成长有据可查'),
        link: '/experiences/new',
      },
      {
        key: 'retrospective',
        done: hasRetrospectives,
        label: t('coach.emptyState.step3', '完成第一次复盘'),
        motivation: t('coach.emptyState.motivation3', '从经历中提炼原则'),
        link: '/projects',
      },
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const allDone = completedCount === steps.length;
    const progressPercent = Math.round((completedCount / steps.length) * 100);

    return (
      <section
        className="rounded-2xl border border-gray-200 bg-gradient-to-b from-indigo-50/50 to-white p-6 space-y-6"
        data-testid="empty-state-checklist"
      >
        {/* Header */}
        <div className="text-center space-y-3 animate-fade-in">
          <div className="mx-auto w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center text-3xl">
            🧠
          </div>
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              {t('coach.emptyState.title', '开启你的成长教练')}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {t(
                'coach.emptyState.subtitle',
                '完成以下 3 步，AI 教练将为你生成个性化成长诊断',
              )}
            </p>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>
              {t('coach.emptyState.progress', '进度')} {completedCount}/{steps.length}
            </span>
            <span className="font-medium text-indigo-600">{progressPercent}%</span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500 animate-pulse-glow"
            style={{ width: `${progressPercent}%` }}
          />
          </div>
        </div>

        {/* Steps */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <Link
              key={step.key}
              to={step.link}
              className={`group flex items-start gap-3 p-3 rounded-xl border transition-all duration-200 animate-fade-in stagger-${Math.min(index + 1, 4)} ${
                step.done
                  ? 'bg-green-50/50 border-green-200 cursor-default'
                  : 'bg-white border-gray-200 hover:border-indigo-300 hover:shadow-sm'
              }`}
              onClick={(e) => {
                if (step.done) e.preventDefault();
              }}
              aria-label={step.label}
            >
              {/* Step Indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {step.done ? (
                  <div className="w-7 h-7 rounded-full bg-green-500 flex items-center justify-center">
                    <span className="text-white text-sm font-bold">✓</span>
                  </div>
                ) : (
                  <div
                    className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-semibold transition-colors ${
                      index === completedCount
                        ? 'border-indigo-500 bg-indigo-500 text-white'
                        : 'border-gray-300 text-gray-400'
                    }`}
                  >
                    {index + 1}
                  </div>
                )}
              </div>

              {/* Step Content */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-medium ${step.done ? 'text-green-700 line-through' : 'text-gray-900'}`}
                >
                  {step.label}
                </p>
                <p
                  className={`text-xs mt-0.5 ${step.done ? 'text-green-600' : 'text-gray-500'}`}
                >
                  {step.motivation}
                </p>
              </div>

              {/* Arrow (only for pending steps) */}
              {!step.done && (
                <span className="flex-shrink-0 text-gray-400 group-hover:text-indigo-500 transition-colors mt-1">
                  →
                </span>
              )}
            </Link>
          ))}
        </div>

        {/* Completion Message */}
        {allDone && (
          <div className="text-center p-4 bg-green-50 rounded-xl border border-green-200">
            <p className="text-green-700 font-semibold">
              {t('coach.emptyState.done', '全部完成！Coach 即将为你生成诊断')}
            </p>
            <p className="text-xs text-green-600 mt-1">
              {t('coach.emptyState.doneHint', '刷新页面或稍等片刻即可看到个性化建议')}
            </p>
          </div>
        )}
      </section>
    );
  },
);

export default EmptyStateChecklist;
