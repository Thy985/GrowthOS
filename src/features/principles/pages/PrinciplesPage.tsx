import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';

import type { AppDispatch } from '../../../app/store';
import type { Principle, PrinciplesState, RootState } from '../../../shared/types';
import {
  addPrinciple,
  deletePrinciple,
  updatePrinciple,
  getPrinciplesByCategory,
} from '../store/principleSlice';

const CATEGORY_OPTIONS = ['all', 'learning', 'work', 'communication', 'life', 'other'] as const;

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function getConfidenceColorClasses(confidence: number): string {
  const pct = confidence * 100;
  if (pct > 75) return 'bg-green-100 text-green-700 border-green-300';
  if (pct >= 50) return 'bg-yellow-100 text-yellow-700 border-yellow-300';
  return 'bg-red-100 text-red-700 border-red-300';
}

function getConfidenceBarColor(confidence: number): string {
  const pct = confidence * 100;
  if (pct > 75) return 'bg-green-500';
  if (pct >= 50) return 'bg-yellow-500';
  return 'bg-red-400';
}

// ---------------------------------------------------------------------------
// Modal Form
// ---------------------------------------------------------------------------

interface ModalFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Principle, 'id' | 'createdAt'>) => void;
}

const ModalForm = React.memo(function ModalForm({ isOpen, onClose, onSubmit }: ModalFormProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [userId, setUserId] = useState('');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!content.trim() || !userId.trim()) return;

      onSubmit({
        userId: userId.trim(),
        content: content.trim(),
        sourceExperienceIds: [],
        category: category || undefined,
        confidence: 0.5,
        usageCount: 0,
      });

      setContent('');
      setCategory('');
      setUserId('');
      onClose();
    },
    [content, category, userId, onSubmit, onClose],
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {t('principles.newPrinciple', '添加原则')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* User ID */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('principles.userId', '用户 ID')}
            </label>
            <input
              type="text"
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
              placeholder="user-id"
              required
            />
          </div>
          {/* Content */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('principles.content', '原则内容')}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
              rows={3}
              required
            />
          </div>
          {/* Category */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('principles.category', '类别')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
            >
              <option value="">{t('common.noData', '无')}</option>
              {CATEGORY_OPTIONS.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {t(`principles.categories.${cat}`, cat)}
                </option>
              ))}
            </select>
          </div>
          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {t('common.cancel', '取消')}
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors"
            >
              {t('common.save', '保存')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Principle Card
// ---------------------------------------------------------------------------

interface PrincipleCardProps {
  principle: Principle;
  onDelete: (id: string) => void;
  onEdit: (principle: Principle) => void;
}

const PrincipleCard = React.memo(function PrincipleCard({
  principle,
  onDelete,
  onEdit,
}: PrincipleCardProps) {
  const { t } = useTranslation();
  const confidencePct = Math.round(principle.confidence * 100);

  return (
    <div className="group rounded-xl border border-gray-100 bg-white p-5 shadow-md transition-shadow hover:shadow-lg">
      {/* Confidence bar at top */}
      <div className="mb-3 w-full bg-gray-200 rounded-full h-1.5">
        <div
          className={`h-1.5 rounded-full transition-all duration-500 ${getConfidenceBarColor(principle.confidence)}`}
          style={{ width: `${confidencePct}%` }}
        />
      </div>

      {/* Content */}
      <p className="mb-4 text-gray-800 text-sm leading-relaxed">{principle.content}</p>

      {/* Meta row */}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        {/* Confidence badge */}
        <span
          className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${getConfidenceColorClasses(principle.confidence)}`}
        >
          {confidencePct}%
        </span>

        {/* Category */}
        {principle.category && (
          <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200">
            {t(`principles.categories.${principle.category}`, principle.category)}
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500 mb-3">
        <span>
          {t('principles.verified', '已验证')} {principle.usageCount} {t('principles.times', '次')}
        </span>
        <span>
          {t('principles.fromExperiences', '来自')} {principle.sourceExperienceIds.length}{' '}
          {t('principles.experiences', '个经历')}
        </span>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-gray-100">
        <span className="text-xs text-gray-400">{formatDate(principle.createdAt)}</span>
        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={() => onEdit(principle)}
            className="rounded-lg px-2 py-1 text-xs text-gray-600 hover:bg-gray-100 transition-colors"
          >
            {t('common.edit', '编辑')}
          </button>
          <button
            onClick={() => onDelete(principle.id)}
            className="rounded-lg px-2 py-1 text-xs text-red-500 hover:bg-red-50 transition-colors"
          >
            {t('common.delete', '删除')}
          </button>
        </div>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Edit Modal
// ---------------------------------------------------------------------------

interface EditModalProps {
  principle: Principle | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: { id: string } & Partial<Principle>) => void;
}

const EditModal = React.memo(function EditModal({
  principle,
  isOpen,
  onClose,
  onSave,
}: EditModalProps) {
  const { t } = useTranslation();
  const [content, setContent] = useState('');
  const [category, setCategory] = useState('');
  const [confidence, setConfidence] = useState(50);

  React.useEffect(() => {
    if (principle) {
      setContent(principle.content);
      setCategory(principle.category || '');
      setConfidence(Math.round(principle.confidence * 100));
    }
  }, [principle]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!principle || !content.trim()) return;

      onSave({
        id: principle.id,
        content: content.trim(),
        category: category || undefined,
        confidence: confidence / 100,
      });

      onClose();
    },
    [principle, content, category, confidence, onSave, onClose],
  );

  if (!isOpen || !principle) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-lg font-semibold text-gray-800">
          {t('principles.editPrinciple', '编辑原则')}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('principles.content', '原则内容')}
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
              rows={3}
              required
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('principles.category', '类别')}
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
            >
              <option value="">{t('common.noData', '无')}</option>
              {CATEGORY_OPTIONS.filter((c) => c !== 'all').map((cat) => (
                <option key={cat} value={cat}>
                  {t(`principles.categories.${cat}`, cat)}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              {t('principles.confidence', '确信度')}: {confidence}%
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={confidence}
              onChange={(e) => setConfidence(Number(e.target.value))}
              className="w-full"
            />
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 transition-colors"
            >
              {t('common.cancel', '取消')}
            </button>
            <button
              type="submit"
              className="rounded-lg px-4 py-2 text-sm font-medium text-white bg-green-500 hover:bg-green-600 transition-colors"
            >
              {t('common.save', '保存')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

function PrinciplesPageInner() {
  const { t } = useTranslation();
  const dispatch = useDispatch<AppDispatch>();
  const { principles, isLoading, error } = useSelector(
    (state: RootState) => state.principles as PrinciplesState,
  );

  const [activeCategory, setActiveCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPrinciple, setEditingPrinciple] = useState<Principle | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Filtered + sorted principles
  const displayedPrinciples = useMemo(() => {
    let filtered =
      activeCategory === 'all'
        ? [...principles]
        : getPrinciplesByCategory(
            { principles: { principles } as PrinciplesState },
            activeCategory,
          );

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter((p) => p.content.toLowerCase().includes(q));
    }

    // Sort by confidence * usageCount descending
    filtered.sort((a, b) => b.confidence * b.usageCount - a.confidence * a.usageCount);

    return filtered;
  }, [principles, activeCategory, searchQuery]);

  const handleAdd = useCallback(
    (data: Omit<Principle, 'id' | 'createdAt'>) => {
      dispatch(addPrinciple(data));
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(deletePrinciple(id));
    },
    [dispatch],
  );

  const handleEdit = useCallback(
    (data: { id: string } & Partial<Principle>) => {
      dispatch(updatePrinciple(data));
    },
    [dispatch],
  );

  const handleEditClick = useCallback((principle: Principle) => {
    setEditingPrinciple(principle);
    setIsEditModalOpen(true);
  }, []);

  const handleEditClose = useCallback(() => {
    setEditingPrinciple(null);
    setIsEditModalOpen(false);
  }, []);

  if (isLoading && principles.length === 0) {
    return (
      <div className="flex min-h-[200px] items-center justify-center">
        <div className="text-gray-500">{t('common.loading', '加载中...')}</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{t('principles.title', '经验库')}</h1>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="inline-block rounded-lg bg-green-500 px-4 py-2 font-medium text-white transition-all duration-200 hover:bg-green-600 cursor-pointer"
        >
          {t('principles.newPrincipleButton', '+ 新原则')}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Search */}
      <div>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={t('principles.searchPlaceholder', '搜索原则内容...')}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-transparent focus:ring-2 focus:ring-green-500"
        />
      </div>

      {/* Category filter buttons */}
      <div className="flex flex-wrap gap-2">
        {CATEGORY_OPTIONS.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-green-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {t(`principles.categories.${cat}`, cat)}
          </button>
        ))}
      </div>

      {/* Results count */}
      <div className="text-sm text-gray-500">
        {t('principles.total', '共')} {displayedPrinciples.length} {t('principles.items', '条原则')}
      </div>

      {/* Principle list */}
      {displayedPrinciples.length === 0 ? (
        <div className="rounded-xl border border-gray-100 bg-white p-8 text-center text-gray-500 shadow-md">
          {principles.length === 0
            ? t('principles.empty', '暂无原则，当你记录经历并提炼原则后会显示在这里')
            : t('principles.noResults', '未找到匹配的原则')}
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {displayedPrinciples.map((p) => (
            <PrincipleCard
              key={p.id}
              principle={p}
              onDelete={handleDelete}
              onEdit={handleEditClick}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <ModalForm
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleAdd}
      />
      <EditModal
        principle={editingPrinciple}
        isOpen={isEditModalOpen}
        onClose={handleEditClose}
        onSave={handleEdit}
      />
    </div>
  );
}

export default React.memo(PrinciplesPageInner);
