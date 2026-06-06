import React, { useState, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';

import type { AppDispatch } from '../../../app/store';
import type { Project, RootState } from '../../../shared/types';
import {
  addProject,
  deleteProject,
  updateProject,
  getActiveProjects,
  getCompletedProjects,
} from '../store/projectSlice';

/* eslint-disable react/no-unescaped-entities */

// ─── Constants ───────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<Project['status'], string> = {
  active: '进行中',
  completed: '已完成',
  paused: '已暂停',
  abandoned: '已废弃',
};

const STATUS_COLORS: Record<Project['status'], string> = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  abandoned: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400',
};

const SECTION_CONFIGS: {
  key: string;
  title: string;
  emptyMsg: string;
}[] = [
  {
    key: 'active',
    title: '进行中',
    emptyMsg: '暂无进行中的项目，点击下方按钮创建新项目',
  },
  {
    key: 'completed',
    title: '已完成',
    emptyMsg: '暂无已完成的项目',
  },
  {
    key: 'paused',
    title: '已暂停',
    emptyMsg: '暂无已暂停的项目',
  },
];

// ─── Types ───────────────────────────────────────────────────────────────────

interface ProjectFormData {
  name: string;
  description: string;
  status: Project['status'];
  startDate: string;
  endDate: string;
  whatWentWell: string;
  whatWentWrong: string;
  nextTime: string;
}

const initialFormData: ProjectFormData = {
  name: '',
  description: '',
  status: 'active',
  startDate: '',
  endDate: '',
  whatWentWell: '',
  whatWentWrong: '',
  nextTime: '',
};

// ─── Modal Component ─────────────────────────────────────────────────────────

interface ProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: ProjectFormData) => void;
}

const ProjectModal: React.FC<ProjectModalProps> = React.memo(function ProjectModal({
  isOpen,
  onClose,
  onSubmit,
}) {
  const [form, setForm] = useState<ProjectFormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      const { name, value } = e.target;
      setForm((prev) => ({ ...prev, [name]: value }));
      if (errors[name]) {
        setErrors((prev) => {
          const next = { ...prev };
          delete next[name];
          return next;
        });
      }
    },
    [errors],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!form.name.trim()) {
        setErrors({ name: '项目名称为必填项' });
        return;
      }
      onSubmit(form);
      setForm(initialFormData);
      setErrors({});
    },
    [form, onSubmit],
  );

  const handleClose = useCallback(() => {
    setForm(initialFormData);
    setErrors({});
    onClose();
  }, [onClose]);

  if (!isOpen) return null;

  const showRetrospective = form.status === 'completed';

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-lg my-8 bg-white dark:bg-gray-900 rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold">新建项目</h2>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-xl leading-none"
            onClick={handleClose}
            aria-label="关闭"
          >
            &times;
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-4 space-y-4">
          {/* name */}
          <div>
            <label className="block text-sm font-medium mb-1">
              项目名称 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="输入项目名称"
              className={`w-full rounded-lg border px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-400' : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
          </div>

          {/* description */}
          <div>
            <label className="block text-sm font-medium mb-1">描述</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              placeholder="项目描述（可选）"
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* status */}
          <div>
            <label className="block text-sm font-medium mb-1">状态</label>
            <select
              name="status"
              value={form.status}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="active">进行中</option>
              <option value="completed">已完成</option>
              <option value="paused">已暂停</option>
              <option value="abandoned">已废弃</option>
            </select>
          </div>

          {/* dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium mb-1">开始日期</label>
              <input
                type="date"
                name="startDate"
                value={form.startDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">结束日期</label>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Retrospective section */}
          {showRetrospective && (
            <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <h3 className="text-sm font-semibold">项目复盘</h3>

              <div>
                <label className="block text-sm font-medium mb-1">做得好的（每行一条）</label>
                <textarea
                  name="whatWentWell"
                  value={form.whatWentWell}
                  onChange={handleChange}
                  rows={3}
                  placeholder="例如：&#10;按时完成第一阶段&#10;团队协作顺畅"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">需要改进的（每行一条）</label>
                <textarea
                  name="whatWentWrong"
                  value={form.whatWentWrong}
                  onChange={handleChange}
                  rows={3}
                  placeholder="例如：&#10;需求变更频繁&#10;测试覆盖不足"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">下次注意（每行一条）</label>
                <textarea
                  name="nextTime"
                  value={form.nextTime}
                  onChange={handleChange}
                  rows={3}
                  placeholder="例如：&#10;提前锁定需求范围&#10;增加代码评审环节"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-3 py-2 text-sm bg-transparent focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleClose}
              className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            >
              创建
            </button>
          </div>
        </form>
      </div>

      {/* backdrop click */}
      <div className="fixed inset-0 -z-10" onClick={handleClose} />
    </div>
  );
});

// ─── Project Card Component ──────────────────────────────────────────────────

interface ProjectCardProps {
  project: Project;
  onDelete: (id: string) => void;
  onCreateRetrospective: (id: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = React.memo(function ProjectCard({
  project,
  onDelete,
  onCreateRetrospective,
}) {
  const hasRetrospective = !!project.retrospective;
  const isCompleted = project.status === 'completed';

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const truncate = (text?: string, max = 120) => {
    if (!text) return null;
    return text.length > max ? text.slice(0, max) + '...' : text;
  };

  return (
    <div className="group relative rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm hover:shadow-md transition-shadow">
      {/* Delete button – visible on hover */}
      <button
        className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity rounded-md p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30"
        onClick={() => onDelete(project.id)}
        aria-label="删除项目"
        title="删除"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-4 w-4"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14zM10 11v6M14 11v6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {/* Name */}
      <h3 className="text-base font-semibold pr-8">{project.name}</h3>

      {/* Description */}
      {project.description && (
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400 leading-relaxed">
          {truncate(project.description)}
        </p>
      )}

      {/* Status badge */}
      <span
        className={`inline-block mt-3 rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_COLORS[project.status]}`}
      >
        {STATUS_LABELS[project.status]}
      </span>

      {/* Date range */}
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-3.5 w-3.5 flex-shrink-0"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
          <line x1="16" y1="2" x2="16" y2="6" />
          <line x1="8" y1="2" x2="8" y2="6" />
          <line x1="3" y1="10" x2="21" y2="10" />
        </svg>
        <span>
          {formatDate(project.startDate)} → {formatDate(project.endDate)}
        </span>
      </div>

      {/* Retrospective section for completed projects */}
      {isCompleted && (
        <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 flex items-center gap-3">
          {hasRetrospective ? (
            <span
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-medium"
              title="已复盘"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <rect x="9" y="3" width="6" height="4" rx="1" />
                <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              已复盘
            </span>
          ) : (
            <button
              className="rounded-md bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-3 py-1.5 text-xs font-medium hover:bg-amber-200 dark:hover:bg-amber-900/50 transition-colors"
              onClick={() => onCreateRetrospective(project.id)}
            >
              复盘
            </button>
          )}
        </div>
      )}
    </div>
  );
});

// ─── Projects Page ───────────────────────────────────────────────────────────

const ProjectsPage: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { projects, isLoading } = useSelector((state: RootState) => state.projects);
  const activeProjects = useSelector(getActiveProjects);
  const completedProjects = useSelector(getCompletedProjects);
  const userId = useSelector((state: RootState) => state.auth.user?.id ?? '');

  const [modalOpen, setModalOpen] = useState(false);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCreate = useCallback(
    (data: ProjectFormData) => {
      const lines = (s: string) =>
        s
          .split('\n')
          .map((l) => l.trim())
          .filter(Boolean);

      const payload = {
        userId,
        name: data.name.trim(),
        description: data.description.trim() || undefined,
        status: data.status,
        startDate: data.startDate || undefined,
        endDate: data.endDate || undefined,
        retrospective:
          data.status === 'completed'
            ? {
                whatWentWell: lines(data.whatWentWell),
                whatWentWrong: lines(data.whatWentWrong),
                nextTime: lines(data.nextTime),
              }
            : undefined,
      };

      dispatch(addProject(payload));
      setModalOpen(false);
    },
    [dispatch],
  );

  const handleDelete = useCallback(
    (id: string) => {
      if (window.confirm('确定要删除这个项目吗？')) {
        dispatch(deleteProject(id));
      }
    },
    [dispatch],
  );

  const handleCreateRetrospective = useCallback(
    (id: string) => {
      if (window.confirm('是否要为此项目创建复盘？')) {
        dispatch(
          updateProject({
            id,
            retrospective: {
              whatWentWell: [],
              whatWentWrong: [],
              nextTime: [],
            },
          }),
        );
      }
    },
    [dispatch],
  );

  // ── Derived: paused projects (no selector available) ─────────────────────

  const pausedProjects = useMemo(() => projects.filter((p) => p.status === 'paused'), [projects]);

  // ── Empty check ──────────────────────────────────────────────────────────

  const totalVisible = activeProjects.length + completedProjects.length + pausedProjects.length;

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold sm:text-2xl">项目管理</h1>
          <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
            管理 GrowthOS 项目的生命周期与复盘
          </p>
        </div>
        <button
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 active:bg-blue-800 transition-colors"
          onClick={() => setModalOpen(true)}
        >
          + New Project
        </button>
      </div>

      {isLoading && (
        <div className="flex items-center justify-center py-12 text-sm text-gray-500">
          加载中...
        </div>
      )}

      {/* Empty state */}
      {!isLoading && totalVisible === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 py-16 text-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="mb-4 h-12 w-12 text-gray-300 dark:text-gray-600"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <p className="text-base font-medium text-gray-600 dark:text-gray-300">还没有任何项目</p>
          <p className="mt-1 text-sm text-gray-400">
            点击右上方的「+ New Project」按钮创建你的第一个项目吧
          </p>
          <button
            className="mt-4 rounded-lg bg-blue-600 px-5 py-2 text-sm font-medium text-white hover:bg-blue-700 transition-colors"
            onClick={() => setModalOpen(true)}
          >
            + New Project
          </button>
        </div>
      )}

      {/* Status sections */}
      {!isLoading && totalVisible > 0 && (
        <div className="space-y-8">
          {SECTION_CONFIGS.map(({ key, title, emptyMsg }) => {
            const sectionProjects =
              key === 'active'
                ? activeProjects
                : key === 'completed'
                  ? completedProjects
                  : pausedProjects;

            return (
              <section key={key}>
                <h2 className="mb-3 text-base font-semibold flex items-center gap-2">
                  <span
                    className={`inline-block h-2.5 w-2.5 rounded-full ${
                      key === 'active'
                        ? 'bg-green-500'
                        : key === 'completed'
                          ? 'bg-blue-500'
                          : 'bg-yellow-500'
                    }`}
                  />
                  {title}
                  <span className="ml-1 text-xs font-normal text-gray-400">
                    ({sectionProjects.length})
                  </span>
                </h2>

                {sectionProjects.length === 0 ? (
                  <p className="text-sm text-gray-400 italic py-2">{emptyMsg}</p>
                ) : (
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    {sectionProjects.map((project) => (
                      <ProjectCard
                        key={project.id}
                        project={project}
                        onDelete={handleDelete}
                        onCreateRetrospective={handleCreateRetrospective}
                      />
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Modal */}
      <ProjectModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleCreate}
      />
    </div>
  );
};

export default React.memo(ProjectsPage);
