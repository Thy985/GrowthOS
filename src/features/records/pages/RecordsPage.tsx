import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector } from 'react-redux';

import type { RootState } from '../../../shared/types/index.ts';
import {
  formatDate,
  getMoodColor,
  highlightSearchTerm,
  filterRecords,
} from '../../../shared/utils/recordUtils.tsx';

const RecordList = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const { records, tags } = useSelector((state: RootState) => state.records);

  const allTags = tags;
  const allMoods = [
    t('records.moodHappy', '很好'),
    t('records.moodNeutral', '一般'),
    t('records.moodBad', '不太好'),
  ] as const;

  const filteredRecords = useMemo(() => {
    return filterRecords(records, searchTerm, selectedMoods, selectedTags, dateRange);
  }, [records, searchTerm, selectedMoods, selectedTags, dateRange]);

  const toggleMood = useCallback((mood: string) => {
    setSelectedMoods((prev) =>
      prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood],
    );
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedMoods([]);
    setSelectedTags([]);
    setDateRange({ start: '', end: '' });
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('records.title', '记录列表')}</h1>
        {(searchTerm ||
          selectedMoods.length > 0 ||
          selectedTags.length > 0 ||
          dateRange.start ||
          dateRange.end) && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors w-full sm:w-auto"
          >
            {t('records.clearFilters', '清除过滤')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('records.searchPlaceholder', '搜索记录...')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('records.startDate', '开始日期')}
            </label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('records.endDate', '结束日期')}
            </label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">
            {t('records.moodFilter', '情绪状态')}
          </h3>
          <div className="flex flex-wrap gap-2">
            {allMoods.map((mood) => (
              <button
                key={mood}
                onClick={() => toggleMood(mood)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedMoods.includes(mood)
                    ? `${getMoodColor(mood)} border-2 border-current`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>

        {allTags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              {t('records.tagFilter', '标签')}
            </h3>
            <div className="flex flex-wrap gap-2">
              {allTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 text-sm rounded-full transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-green-100 text-green-800 border-2 border-green-500'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  #{tag}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="text-sm text-gray-600">
        {t('records.showingCount', { count: filteredRecords.length })}
      </div>

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {t('records.noResults', '没有找到符合条件的记录')}
          </div>
        ) : (
          filteredRecords.map((record) => (
            <div
              key={record.id}
              className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span
                    className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getMoodColor(record.mood)}`}
                  >
                    {record.mood}
                  </span>
                  <p className="text-sm text-gray-500">{formatDate(record.createdAt)}</p>
                </div>
              </div>

              {record.activity && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    {t('records.whatDid', '做了什么')}
                  </h4>
                  <p className="text-gray-600">
                    {searchTerm
                      ? highlightSearchTerm(record.activity, searchTerm)
                      : record.activity}
                  </p>
                </div>
              )}

              {record.learning && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    {t('records.whatLearned', '学了什么')}
                  </h4>
                  <p className="text-gray-600">
                    {searchTerm
                      ? highlightSearchTerm(record.learning, searchTerm)
                      : record.learning}
                  </p>
                </div>
              )}

              {record.reflection && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">
                    {t('records.reflection', '反思')}
                  </h4>
                  <p className="text-gray-600">
                    {searchTerm
                      ? highlightSearchTerm(record.reflection, searchTerm)
                      : record.reflection}
                  </p>
                </div>
              )}

              {record.tags && record.tags.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1">
                    {record.tags.map((tag) => (
                      <span
                        key={tag}
                        className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default React.memo(RecordList);
