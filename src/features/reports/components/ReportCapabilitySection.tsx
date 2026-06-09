import React from 'react';
import { useTranslation } from 'react-i18next';

import type { ReportCapabilityChange } from '../types/reportTypes';

interface ReportCapabilitySectionProps {
  topGainers: ReportCapabilityChange[];
  decliners: ReportCapabilityChange[];
}

const CapabilityRow: React.FC<{ item: ReportCapabilityChange; positive: boolean }> = React.memo(
  function CapabilityRow({ item, positive }) {
    const percent = Math.round((item.metric.currentLevel / item.metric.targetLevel) * 100);
    return (
      <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
        <span className="text-lg">{positive ? '📈' : '📉'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 truncate">{item.metric.name}</p>
          <div className="mt-1 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className={`h-1.5 rounded-full ${positive ? 'bg-green-500' : 'bg-red-500'}`}
              style={{ width: `${Math.min(percent, 100)}%` }}
            />
          </div>
        </div>
        <span
          className={`text-sm font-semibold flex-shrink-0 ${positive ? 'text-green-600' : 'text-red-600'}`}
        >
          {positive ? `+${item.change}` : item.change}
        </span>
      </div>
    );
  },
);

const ReportCapabilitySection: React.FC<ReportCapabilitySectionProps> = React.memo(
  function ReportCapabilitySection({ topGainers, decliners }) {
    const { t } = useTranslation();

    if (topGainers.length === 0 && decliners.length === 0) {
      return (
        <section className="rounded-2xl border border-gray-200 bg-white p-4">
          <h2 className="text-lg font-semibold mb-3">
            {t('reports.capabilityChanges', '能力变化')}
          </h2>
          <p className="text-gray-400 text-sm">
            {t('reports.noCapabilityChanges', '本期暂无能力变化')}
          </p>
        </section>
      );
    }

    return (
      <section className="rounded-2xl border border-gray-200 bg-white p-4 space-y-4">
        <h2 className="text-lg font-semibold">{t('reports.capabilityChanges', '能力变化')}</h2>

        {topGainers.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-green-600">
              {t('reports.topGainers', '增长 TOP 5')}
            </p>
            {topGainers.map((g) => (
              <CapabilityRow key={g.metric.capabilityId} item={g} positive={true} />
            ))}
          </div>
        )}

        {decliners.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-red-600">{t('reports.decliners', '需关注')}</p>
            {decliners.map((d) => (
              <CapabilityRow key={d.metric.capabilityId} item={d} positive={false} />
            ))}
          </div>
        )}
      </section>
    );
  },
);

export default ReportCapabilitySection;
