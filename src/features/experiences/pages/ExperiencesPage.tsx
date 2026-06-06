import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import type {
  Experience,
  Capability,
  ExperienceCapabilityLink,
  ExperiencesState,
  CapabilitiesState,
  RootState,
} from '../../../shared/types';

const TRUNCATE_LENGTH = 120;

function truncate(text: string | undefined, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getConfidenceColor(confidence: number): string {
  if (confidence >= 0.8) return 'bg-green-500';
  if (confidence >= 0.5) return 'bg-yellow-500';
  return 'bg-red-400';
}

function getConfidenceLabel(confidence: number, t: (key: string) => string): string {
  if (confidence >= 0.8) return t('experiences.high');
  if (confidence >= 0.5) return t('experiences.medium');
  return t('experiences.low');
}

interface ExperienceCardProps {
  experience: Experience;
  capabilityLinks: ExperienceCapabilityLink[];
  capabilities: Capability[];
}

const ExperienceCard = React.memo(function ExperienceCard({
  experience,
  capabilityLinks,
  capabilities,
}: ExperienceCardProps) {
  const { t } = useTranslation();
  const linkedCapabilityIds = new Set(capabilityLinks.map((l) => l.capabilityId));
  const linkedCapabilities = capabilities.filter((cap) => linkedCapabilityIds.has(cap.id));

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-100 p-5 hover:shadow-lg transition-shadow">
      {/* Header: date and confidence */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">
          {formatDate(experience.occurredAt || experience.createdAt)}
        </span>
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-500">{t('experiences.confidence')}</span>
          <span
            className={`inline-block px-2 py-0.5 text-xs rounded-full text-white ${getConfidenceColor(experience.confidence)}`}
          >
            {getConfidenceLabel(experience.confidence, t)} (
            {Math.round(experience.confidence * 100)}%)
          </span>
        </div>
      </div>

      {/* Confidence bar */}
      <div className="mb-4">
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-500 ${getConfidenceColor(experience.confidence)}`}
            style={{ width: `${Math.round(experience.confidence * 100)}%` }}
          />
        </div>
      </div>

      {/* Event */}
      <div className="mb-3">
        <h3 className="text-sm font-medium text-gray-700 mb-1">{t('experiences.event')}</h3>
        <p className="text-gray-800">{experience.event}</p>
      </div>

      {/* Reflection (truncated) */}
      {experience.reflection && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-700 mb-1">{t('experiences.reflection')}</h3>
          <p className="text-gray-600 text-sm">
            {truncate(experience.reflection, TRUNCATE_LENGTH)}
          </p>
        </div>
      )}

      {/* Principle (truncated) */}
      {experience.principle && (
        <div className="mb-3">
          <h3 className="text-sm font-medium text-gray-700 mb-1">{t('experiences.principle')}</h3>
          <p className="text-gray-600 text-sm">{truncate(experience.principle, TRUNCATE_LENGTH)}</p>
        </div>
      )}

      {/* Capability links */}
      {linkedCapabilities.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t border-gray-100">
          {linkedCapabilities.map((cap) => (
            <span
              key={cap.id}
              className="inline-block px-2.5 py-0.5 text-xs rounded-full bg-blue-50 text-blue-700 border border-blue-200"
            >
              {cap.name}
            </span>
          ))}
        </div>
      )}
    </div>
  );
});

const ExperiencesPage = React.memo(function ExperiencesPage() {
  const { t } = useTranslation();
  const { experiences, links, isLoading, error } = useSelector(
    (state: RootState) => state.experiences as ExperiencesState,
  );
  const capabilities = useSelector(
    (state: RootState) => (state.capabilities as CapabilitiesState).capabilities,
  );

  // Filters
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [selectedCapabilityId, setSelectedCapabilityId] = useState<string>('');

  // Filtered and sorted experiences
  const filteredExperiences = useMemo(() => {
    let filtered = [...experiences];

    // Date range filter
    if (dateRange.start) {
      const startDate = new Date(dateRange.start);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.occurredAt || exp.createdAt);
        return expDate >= startDate;
      });
    }
    if (dateRange.end) {
      const endDate = new Date(dateRange.end);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter((exp) => {
        const expDate = new Date(exp.occurredAt || exp.createdAt);
        return expDate <= endDate;
      });
    }

    // Capability filter
    if (selectedCapabilityId) {
      const experienceIds = new Set(
        links
          .filter((link: ExperienceCapabilityLink) => link.capabilityId === selectedCapabilityId)
          .map((link: ExperienceCapabilityLink) => link.experienceId),
      );
      filtered = filtered.filter((exp) => experienceIds.has(exp.id));
    }

    // Sort by date descending
    filtered.sort((a, b) => {
      const dateA = new Date(a.occurredAt || a.createdAt).getTime();
      const dateB = new Date(b.occurredAt || b.createdAt).getTime();
      return dateB - dateA;
    });

    return filtered;
  }, [experiences, links, dateRange, selectedCapabilityId]);

  const clearFilters = useCallback(() => {
    setDateRange({ start: '', end: '' });
    setSelectedCapabilityId('');
  }, []);

  const hasActiveFilters = dateRange.start || dateRange.end || selectedCapabilityId;

  if (isLoading && experiences.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[200px]">
        <div className="text-gray-500">{t('experiences.loading')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('experiences.managementTitle')}</h1>
        <Link to="/experiences/new">
          <span className="inline-block px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-medium transition-all duration-200 cursor-pointer">
            {t('experiences.newExperienceButton')}
          </span>
        </Link>
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md border border-gray-100 p-4 sm:p-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Date range */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('experiences.startDate')}
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('experiences.endDate')}
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            />
          </div>

          {/* Capability filter */}
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('experiences.filterByCapability')}
            </label>
            <select
              value={selectedCapabilityId}
              onChange={(e) => setSelectedCapabilityId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
            >
              <option value="">{t('experiences.allCapabilities')}</option>
              {capabilities.map((cap) => (
                <option key={cap.id} value={cap.id}>
                  {cap.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Clear filters */}
        {hasActiveFilters && (
          <div className="mt-4">
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-gray-700"
            >
              {t('experiences.clearFilters')}
            </button>
          </div>
        )}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {t('common.total')} {filteredExperiences.length} {t('experiences.totalExperiences')}
      </div>

      {/* Experience list */}
      {filteredExperiences.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md border border-gray-100 p-8 text-center text-gray-500">
          {experiences.length === 0
            ? t('experiences.noExperiencesYet')
            : t('experiences.noMatchingExperiences')}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredExperiences.map((exp) => (
            <ExperienceCard
              key={exp.id}
              experience={exp}
              capabilityLinks={links.filter((l) => l.experienceId === exp.id)}
              capabilities={capabilities}
            />
          ))}
        </div>
      )}
    </div>
  );
});

export default ExperiencesPage;
