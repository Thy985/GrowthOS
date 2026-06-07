import React from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';

import { coachActionRegistry } from '../actions/coachActionRegistry';
import type { Recommendation } from '../types/coachTypes';

interface CompletedGrowthProps {
  completedRecs: Recommendation[];
}

const CompletedGrowth: React.FC<CompletedGrowthProps> = React.memo(
  function CompletedGrowth({ completedRecs }) {
    const { t } = useTranslation();
    const [open, setOpen] = React.useState(false);

    if (completedRecs.length === 0) return null;

    return (
      <section className="rounded-2xl border border-gray-200 bg-white">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-gray-700"
        >
          <span>
            {t('coach.completedGrowth', '已完成的成长')} ({completedRecs.length})
          </span>
          <span className="text-gray-400">{open ? '▲' : '▼'}</span>
        </button>
        {open && (
          <ul className="divide-y divide-gray-100 border-t border-gray-100">
            {completedRecs.map((rec) => {
              const action = coachActionRegistry[rec.actionId];
              const href =
                action?.buildRoute?.(rec.actionParams ?? {}) ?? action?.route ?? '#';
              return (
                <li key={rec.id} className="px-4 py-3">
                  <Link to={href} className="flex items-center gap-3 text-sm">
                    <span className="text-green-500">✓</span>
                    <span className="text-gray-500">{rec.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    );
  },
);

export default CompletedGrowth;