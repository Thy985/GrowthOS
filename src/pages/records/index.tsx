import React, { useState, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { RootState, GrowthRecord, Mood } from '../../types';
import { formatDate, getMoodColor, getMoodText, highlightSearchTerm, filterRecords } from '../../utils/recordUtils';
import { useI18n } from '../../i18n/useI18n';
import { MOOD_OPTIONS } from '../../constants';

const RecordList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMoods, setSelectedMoods] = useState<Mood[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const { records, tags } = useSelector((state: RootState) => state.growth);
  const { t } = useI18n();

  const filteredRecords = useMemo(() => {
    return filterRecords(records, searchTerm, selectedMoods, selectedTags, dateRange);
  }, [records, searchTerm, selectedMoods, selectedTags, dateRange]);

  const toggleMood = (mood: Mood) => {
    setSelectedMoods(prev =>
      prev.includes(mood)
        ? prev.filter(m => m !== mood)
        : [...prev, mood]
    );
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag)
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedMoods([]);
    setSelectedTags([]);
    setDateRange({ start: '', end: '' });
  };

  const hasActiveFilters = searchTerm || selectedMoods.length > 0 || selectedTags.length > 0 || dateRange.start || dateRange.end;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
        <h1 className="text-2xl font-bold text-gray-800">{t('records.title')}</h1>
        {hasActiveFilters && (
          <button
            onClick={clearFilters}
            className="px-4 py-2 text-sm bg-gray-100 hover:bg-gray-200 rounded-md transition-colors w-full sm:w-auto"
          >
            {t('records.clearFilters')}
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow p-4 sm:p-6">
        <div className="mb-4">
          <input
            type="text"
            placeholder={t('records.searchRecords')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.startDate')}</label>
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('common.endDate')}</label>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        <div className="mb-4">
          <h3 className="text-sm font-medium text-gray-700 mb-2">{t('records.filterByMood')}</h3>
          <div className="flex flex-wrap gap-2">
            {MOOD_OPTIONS.map((mood) => (
              <button
                key={mood.value}
                onClick={() => toggleMood(mood.value)}
                className={`px-3 py-1 text-sm rounded-full transition-colors ${
                  selectedMoods.includes(mood.value)
                    ? `${getMoodColor(mood.value)} border-2 border-current`
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {getMoodText(mood.value)}
              </button>
            ))}
          </div>
        </div>

        {tags.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">{t('records.filterByTags')}</h3>
            <div className="flex flex-wrap gap-2">
              {tags.map((tag) => (
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
        {t('dashboard.recordsCount', { count: filteredRecords.length })}
      </div>

      <div className="space-y-4">
        {filteredRecords.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {t('common.noData')}
          </div>
        ) : (
          filteredRecords.map((record: GrowthRecord) => (
            <div key={record.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className={`inline-block px-2 py-1 text-xs rounded-full mb-2 ${getMoodColor(record.mood)}`}>
                    {getMoodText(record.mood)}
                  </span>
                  <p className="text-sm text-gray-500">{formatDate(record.createdAt)}</p>
                </div>
              </div>

              {record.activity && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('dashboard.whatDidYouDo')}</h4>
                  <p className="text-gray-600">{highlightSearchTerm(record.activity, searchTerm)}</p>
                </div>
              )}

              {record.learning && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('dashboard.whatDidYouLearn')}</h4>
                  <p className="text-gray-600">{highlightSearchTerm(record.learning, searchTerm)}</p>
                </div>
              )}

              {record.reflection && (
                <div className="mb-3">
                  <h4 className="text-sm font-medium text-gray-700 mb-1">{t('dashboard.reflection')}</h4>
                  <p className="text-gray-600">{highlightSearchTerm(record.reflection, searchTerm)}</p>
                </div>
              )}

              {record.tags && record.tags.length > 0 && (
                <div>
                  <div className="flex flex-wrap gap-1">
                    {record.tags.map((tag: string) => (
                      <span key={tag} className="inline-block px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded">
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

export default RecordList;
