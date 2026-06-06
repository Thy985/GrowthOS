import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch } from 'react-redux';

import type { AppDispatch } from '../../../app/store';
import { addExperience } from '../../experiences/store/experienceSlice';

interface QuickRecordFormProps {
  onSubmitted: () => void;
}

export const QuickRecordForm: React.FC<QuickRecordFormProps> = React.memo(function QuickRecordForm({
  onSubmitted,
}) {
  const { t } = useTranslation();
  const [event, setEvent] = useState('');
  const [reflection, setReflection] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!event.trim()) return;
    await dispatch(
      addExperience({
        userId: '',
        event: event.trim(),
        reflection: reflection.trim() || undefined,
        confidence: 0.5,
        occurredAt: new Date().toISOString(),
      }),
    );
    setEvent('');
    setReflection('');
    onSubmitted();
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        placeholder={t('common.todayWhatHappened', '今天发生了什么？')}
        value={event}
        onChange={(e) => setEvent(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <input
        type="text"
        placeholder={t('common.reflectionOptional', '反思（可选）')}
        value={reflection}
        onChange={(e) => setReflection(e.target.value)}
        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
      />
      <button
        type="submit"
        className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 transition-colors"
      >
        {t('common.record', '记录')}
      </button>
    </form>
  );
});
