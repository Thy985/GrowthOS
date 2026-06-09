/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/ban-ts-comment */
import React, { useState, useMemo, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';

import type { Project, RootState } from '../../../shared/types';
import RetrospectiveWizard from '../../retrospective/components/RetrospectiveWizard';
import { addProject, updateProject, deleteProject } from '../store/projectSlice';

type ProjectStatus = Project['status'];

// ─── New Project Modal ──────────────────────────────────────────

const NewProjectModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => void;
}> = ({ isOpen, onClose, onSubmit }) => {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      userId: 'default',
      name: name.trim(),
      description: description.trim() || undefined,
      status: 'active',
      startDate: new Date(startDate).toISOString(),
      endDate: endDate ? new Date(endDate).toISOString() : undefined,
    });
    setName('');
    setDescription('');
    setStartDate(new Date().toISOString().split('T')[0]);
    setEndDate('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl shadow-xl w-full max-w-lg mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{t('projects.newProjectModal')}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
          >
            &times;
          </button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">{t('projects.projectName')}</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder={t('projects.projectNameRequired')}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              {t('projects.projectDescription')}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">{t('projects.startDate')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">{t('projects.endDate')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none"
              />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex-1 bg-indigo-600 text-white py-2 rounded-lg hover:bg-indigo-700 transition-colors font-medium"
            >
              {t('common.create')}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="flex-1 bg-gray-100 text-gray-700 py-2 rounded-lg hover:bg-gray-200 transition-colors font-medium"
            >
              {t('common.cancel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ─── Project Card ───────────────────────────────────────────────

const ProjectCard: React.FC<{
  project: Project;
  onRetrospect: (p: Project) => void;
  onDelete: (id: string) => void;
  onStatusChange: (id: string, status: ProjectStatus) => void;
}> = ({ project, onRetrospect, onDelete, onStatusChange }) => {
  const { t } = useTranslation();
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const statusColors: Record<ProjectStatus, string> = {
    active: 'bg-emerald-100 text-emerald-700',
    completed: 'bg-blue-100 text-blue-700',
    paused: 'bg-amber-100 text-amber-700',
    abandoned: 'bg-gray-100 text-gray-500',
  };

  const daysFromStart = project.startDate
    ? Math.floor((Date.now() - new Date(project.startDate).getTime()) / 86400000)
    : 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-gray-900 text-lg">{project.name}</h3>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{project.description}</p>
          )}
        </div>
        <span
          className={`px-2 py-0.5 text-xs rounded-full font-medium ${statusColors[project.status]}`}
        >
          {t(`projects.${project.status}`)}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-gray-400 mb-1">
          <span>
            {project.startDate
              ? new Date(project.startDate).toLocaleDateString('zh-CN', {
                  month: 'short',
                  day: 'numeric',
                })
              : '—'}
          </span>
          <span>
            {daysFromStart} {t('common.days', '天')}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1.5">
          <div
            className="h-1.5 rounded-full bg-indigo-500"
            style={{
              width: project.retrospective ? '100%' : `${Math.min(daysFromStart / 3, 100)}%`,
            }}
          />
        </div>
      </div>

      {/* Retrospective */}
      {project.retrospective && (
        <div className="bg-indigo-50 rounded-lg p-3 mb-3">
          <p className="text-xs font-medium text-indigo-700 mb-1">
            ✨ {t('projects.retrospected')}
          </p>
          {project.retrospective.whatWentWell && project.retrospective.whatWentWell.length > 0 && (
            <p className="text-xs text-gray-600 whitespace-pre-line">
              {project.retrospective.whatWentWell.slice(0, 2).join('\n')}
            </p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 mt-4">
        {project.status === 'active' && !project.retrospective && (
          <button
            onClick={() => onRetrospect(project)}
            className="flex-1 text-sm bg-indigo-600 text-white py-1.5 rounded-lg hover:bg-indigo-700 transition-colors"
          >
            {t('projects.doRetrospective')}
          </button>
        )}
        {project.status === 'active' && (
          <button
            onClick={() => onStatusChange(project.id, 'completed')}
            className="text-sm bg-emerald-100 text-emerald-700 px-3 py-1.5 rounded-lg hover:bg-emerald-200 transition-colors"
          >
            {t('common.close')}
          </button>
        )}
        {project.status === 'active' && (
          <button
            onClick={() => onStatusChange(project.id, 'paused')}
            className="text-sm bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg hover:bg-amber-200 transition-colors"
          >
            {t('projects.paused')}
          </button>
        )}
        {!showConfirmDelete ? (
          <button
            onClick={() => setShowConfirmDelete(true)}
            className="text-sm text-gray-400 hover:text-red-500 transition-colors px-2 py-1.5"
          >
            {t('projects.delete')}
          </button>
        ) : (
          <div className="flex items-center gap-1">
            <span className="text-xs text-red-500">{t('projects.confirmDelete')}</span>
            <button
              onClick={() => onDelete(project.id)}
              className="text-xs bg-red-500 text-white px-2 py-1 rounded hover:bg-red-600"
            >
              {t('projects.delete')}
            </button>
            <button
              onClick={() => setShowConfirmDelete(false)}
              className="text-xs bg-gray-200 px-2 py-1 rounded hover:bg-gray-300"
            >
              {t('common.cancel')}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// ─── Main Page ──────────────────────────────────────────────────

const ProjectsPage: React.FC = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch<any>();
  const projects = useSelector((state: RootState) => state.projects.projects);
  const [showNewProject, setShowNewProject] = useState(false);
  const [retroProject, setRetroProject] = useState<Project | null>(null);

  const active = useMemo(() => projects.filter((p) => p.status === 'active'), [projects]);
  const completed = useMemo(() => projects.filter((p) => p.status === 'completed'), [projects]);
  const paused = useMemo(() => projects.filter((p) => p.status === 'paused'), [projects]);

  const handleAdd = useCallback(
    (data: Omit<Project, 'id' | 'createdAt' | 'updatedAt'>) => {
      dispatch(addProject(data));
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      dispatch(deleteProject(id));
    },
    [dispatch],
  );

  const handleStatusChange = useCallback(
    (id: string, status: ProjectStatus) => {
      dispatch(updateProject({ id, status }));
    },
    [dispatch],
  );

  if (projects.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{t('projects.managementTitle')}</h1>
          <button
            onClick={() => setShowNewProject(true)}
            className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
          >
            {t('projects.newProjectButton')}
          </button>
        </div>
        <div className="flex flex-col items-center justify-center py-24 text-gray-400">
          <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M9 13h6m-3-3v6m-9 1V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          <p className="text-lg font-medium">{t('projects.noProjectsYet')}</p>
          <p className="text-sm mt-1">{t('projects.createFirstProject')}</p>
        </div>
        <NewProjectModal
          isOpen={showNewProject}
          onClose={() => setShowNewProject(false)}
          onSubmit={handleAdd}
        />
      </div>
    );
  }

  const sections: { key: string; items: Project[]; labelKey: string; emptyKey: string }[] = [
    {
      key: 'active',
      items: active,
      labelKey: 'projects.activeSection',
      emptyKey: 'projects.noActiveProjects',
    },
    {
      key: 'completed',
      items: completed,
      labelKey: 'projects.completedSection',
      emptyKey: 'projects.noCompletedProjects',
    },
    {
      key: 'paused',
      items: paused,
      labelKey: 'projects.pausedSection',
      emptyKey: 'projects.noPausedProjects',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('projects.managementTitle')}</h1>
          <p className="text-sm text-gray-500 mt-1">{t('projects.managementSubtitle')}</p>
        </div>
        <button
          onClick={() => setShowNewProject(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 font-medium"
        >
          {t('projects.newProjectButton')}
        </button>
      </div>

      {sections.map(({ items, labelKey, emptyKey }) => (
        <section key={labelKey} className="mb-8">
          <h2 className="text-lg font-semibold mb-3 text-gray-800">
            {t(labelKey)} ({items.length})
          </h2>
          {items.length === 0 ? (
            <p className="text-gray-400 text-sm italic">{t(emptyKey)}</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {items.map((p) => (
                <ProjectCard
                  key={p.id}
                  project={p}
                  onRetrospect={setRetroProject}
                  onDelete={handleDelete}
                  onStatusChange={handleStatusChange}
                />
              ))}
            </div>
          )}
        </section>
      ))}

      <NewProjectModal
        isOpen={showNewProject}
        onClose={() => setShowNewProject(false)}
        onSubmit={handleAdd}
      />
      <RetrospectiveWizard
        isOpen={!!retroProject}
        project={retroProject}
        onClose={() => setRetroProject(null)}
      />
    </div>
  );
};

export default React.memo(ProjectsPage);
