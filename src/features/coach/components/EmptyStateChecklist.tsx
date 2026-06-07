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
        link: '/capabilities',
      },
      {
        key: 'experience',
        done: hasExperiences,
        label: t('coach.emptyState.step2', '记录第一段经历'),
        link: '/experiences/new',
      },
      {
        key: 'retrospective',
        done: hasRetrospectives,
        label: t('coach.emptyState.step3', '完成第一次复盘'),
        link: '/projects',
      },
    ];

    const completedCount = steps.filter((s) => s.done).length;
    const allDone = completedCount === steps.length;

    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-6 text-center space-y-4">
        <p className="text-4xl">🧠</p>
        <h2 className="text-lg font-semibold text-gray-900">
          {t('coach.emptyState.title', '开启你的成长教练')}
        </h2>
        <p className="text-sm text-gray-400">
          {t('coach.emptyState.step', '步骤 {{current}}/{{total}}', {
            current: completedCount,
            total: steps.length,
          })}
        </p>

        <div className="space-y-2 text-left max-w-xs mx-auto">
          {steps.map((step) => (
            <Link
              key={step.key}
              to={step.link}
              className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                step.done
                  ? 'bg-green-50 text-green-700 line-through cursor-default'
                  : 'bg-gray-50 text-gray-700 hover:bg-blue-50'
              }`}
              onClick={(e) => {
                if (step.done) e.preventDefault();
              }}
            >
              <span className="flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center text-xs">
                {step.done ? '✓' : '○'}
              </span>
              {step.label}
            </Link>
          ))}
        </div>

        {allDone && (
          <p className="text-sm text-green-600 font-medium">
            {t('coach.emptyState.done', '全部完成！Coach 即将为你生成诊断')}
          </p>
        )}
      </section>
    );
  },
);

export default EmptyStateChecklist;