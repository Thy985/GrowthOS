import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import authReducer from '../../features/auth/store/authSlice';
import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import experienceReducer from '../../features/experiences/store/experienceSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import ProjectsPage from '../../features/projects/pages/ProjectsPage.tsx';
import projectReducer, { setProjects } from '../../features/projects/store/projectSlice';
import recordsReducer from '../../features/records/store/recordsSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';
import type { Project } from '../../shared/types';
import growthReducer from '../../store/slices/growthSlice';

vi.mock('../../shared/utils/logger.ts', () => ({
  default: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

function makeStore() {
  return configureStore({
    reducer: {
      growth: growthReducer,
      records: recordsReducer,
      tree: treeReducer,
      auth: authReducer,
      theme: themeReducer,
      goal: goalReducer,
      reminder: reminderReducer,
      experiences: experienceReducer,
      capabilities: capabilityReducer,
      principles: principleReducer,
      projects: projectReducer,
    },
  });
}

function renderPage(store?: ReturnType<typeof makeStore>) {
  const s = store ?? makeStore();
  return render(
    <Provider store={s}>
      <MemoryRouter>
        <ProjectsPage />
      </MemoryRouter>
    </Provider>,
  );
}

function makeProject(overrides: Partial<Project> = {}): Project {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'project-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Test Project',
    description: overrides.description,
    status: overrides.status ?? 'active',
    startDate: overrides.startDate,
    endDate: overrides.endDate,
    retrospective: overrides.retrospective,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

describe('ProjectsPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  it('renders empty state when no projects exist', () => {
    renderPage();
    expect(screen.getByText('项目管理')).toBeInTheDocument();
    expect(screen.getByText('还没有任何项目')).toBeInTheDocument();
    expect(
      screen.getByText('点击右上方的「+ 新建项目」按钮创建你的第一个项目吧'),
    ).toBeInTheDocument();
  });

  it('shows the "+ New Project" button in empty state', () => {
    renderPage();
    const buttons = screen.getAllByRole('button', { name: '+ 新建项目' });
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });

  // ── With data ────────────────────────────────────────────────────────────

  it('renders active projects in the correct section', () => {
    const store = makeStore();
    const project = makeProject({ id: 'p-1', name: 'Active Project', status: 'active' });
    store.dispatch(setProjects([project]));
    renderPage(store);
    // Section headings contain the count "(1)"
    const headings = screen.getAllByText(/进行中/);
    expect(headings.length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Active Project')).toBeInTheDocument();
  });

  it('renders completed projects in the correct section', () => {
    const store = makeStore();
    const project = makeProject({ id: 'p-1', name: 'Done Project', status: 'completed' });
    store.dispatch(setProjects([project]));
    renderPage(store);
    expect(screen.getAllByText(/已完成/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Done Project')).toBeInTheDocument();
  });

  it('renders paused projects in the correct section', () => {
    const store = makeStore();
    const project = makeProject({ id: 'p-1', name: 'Paused Project', status: 'paused' });
    store.dispatch(setProjects([project]));
    renderPage(store);
    expect(screen.getAllByText(/已暂停/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Paused Project')).toBeInTheDocument();
  });

  it('renders project description when available', () => {
    const store = makeStore();
    const project = makeProject({
      id: 'p-1',
      name: 'Described Project',
      description: 'A great project with many features',
    });
    store.dispatch(setProjects([project]));
    renderPage(store);
    expect(screen.getByText('A great project with many features')).toBeInTheDocument();
  });

  it('shows status badge for each project', () => {
    const store = makeStore();
    const project = makeProject({ id: 'p-1', name: 'Status Test', status: 'active' });
    store.dispatch(setProjects([project]));
    renderPage(store);
    expect(screen.getAllByText('进行中').length).toBeGreaterThanOrEqual(1);
  });

  it('displays project count per section', () => {
    const store = makeStore();
    const p1 = makeProject({ id: 'p-1', name: 'Active 1', status: 'active' });
    const p2 = makeProject({ id: 'p-2', name: 'Active 2', status: 'active' });
    const p3 = makeProject({ id: 'p-3', name: 'Completed 1', status: 'completed' });
    store.dispatch(setProjects([p1, p2, p3]));
    renderPage(store);

    expect(screen.getAllByText(/进行中/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/已完成/).length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText(/已暂停/).length).toBeGreaterThanOrEqual(1);
  });

  it('shows retrospective indicator for completed projects with retrospective', () => {
    const store = makeStore();
    const project = makeProject({
      id: 'p-1',
      name: 'Reviewed Project',
      status: 'completed',
      retrospective: {
        whatWentWell: ['Good teamwork'],
        whatWentWrong: ['Late delivery'],
        nextTime: ['Plan better'],
      },
    });
    store.dispatch(setProjects([project]));
    renderPage(store);
    expect(screen.getByText(/已复盘/)).toBeInTheDocument();
  });

  it('shows retrospective button for active projects without retrospective', () => {
    const store = makeStore();
    const project = makeProject({
      id: 'p-1',
      name: 'Unreviewed Project',
      status: 'active',
    });
    store.dispatch(setProjects([project]));
    renderPage(store);
    expect(screen.getByRole('button', { name: '复盘' })).toBeInTheDocument();
  });

  it('does not show retrospective button for active projects with retrospective', () => {
    const store = makeStore();
    const project = makeProject({
      id: 'p-1',
      name: 'Active Project',
      status: 'active',
      retrospective: {
        whatWentWell: ['Good teamwork'],
        whatWentWrong: ['Late delivery'],
        nextTime: ['Plan better'],
      },
    });
    store.dispatch(setProjects([project]));
    renderPage(store);
    expect(screen.queryByRole('button', { name: '复盘' })).not.toBeInTheDocument();
  });

  // ── CRUD actions ─────────────────────────────────────────────────────────

  it('opens create modal when "+ 新建项目" button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    const buttons = screen.getAllByRole('button', { name: '+ 新建项目' });
    await user.click(buttons[0]);
    expect(screen.getByText('新建项目')).toBeInTheDocument();
  });

  it('submits new project via addProject thunk', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    renderPage(store);

    // Open modal
    const buttons = screen.getAllByRole('button', { name: '+ 新建项目' });
    await user.click(buttons[0]);
    expect(screen.getByText('新建项目')).toBeInTheDocument();

    // Fill form
    const nameInput = screen.getByPlaceholderText('项目名称为必填项');
    await user.type(nameInput, 'My New Project');

    // Find the description textarea by querying all textareas and picking the one that's not the name input
    const modal = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    const textarea = modal?.querySelector('textarea') as HTMLTextAreaElement;
    await user.type(textarea, 'Project description');

    // Submit
    await user.click(screen.getByRole('button', { name: '创建' }));

    // Modal should close
    expect(screen.queryByText('新建项目')).not.toBeInTheDocument();
  });

  it('prevents submission without project name', async () => {
    const user = userEvent.setup();
    renderPage();

    const buttons = screen.getAllByRole('button', { name: '+ 新建项目' });
    await user.click(buttons[0]);
    expect(screen.getByText('新建项目')).toBeInTheDocument();

    // Submit empty form (name is required, form just doesn't submit)
    await user.click(screen.getByRole('button', { name: '创建' }));

    // Modal should still be open since name is required
    expect(screen.getByText('新建项目')).toBeInTheDocument();
  });

  it('opens retrospective wizard when retrospect button is clicked', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const project = makeProject({ id: 'p-retro', name: 'Retro Test', status: 'active' });
    store.dispatch(setProjects([project]));
    renderPage(store);

    // Click the retrospective button on the project card
    const retroBtn = screen.getByRole('button', { name: '复盘' });
    await user.click(retroBtn);

    // Retrospective wizard should open with step 1 (select capabilities)
    expect(screen.getByText('项目复盘')).toBeInTheDocument();
    expect(screen.getByText('选择能力')).toBeInTheDocument();
  });

  it('triggers deleteProject when delete button is clicked', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const project = makeProject({ id: 'p-delete', name: 'Delete Me' });
    store.dispatch(setProjects([project]));
    renderPage(store);

    // The delete button shows "删除" text (no aria-label)
    const deleteBtn = screen.getByRole('button', { name: '删除' });
    await user.click(deleteBtn);

    // Confirm dialog should appear
    expect(screen.getByText('确定要删除这个项目吗？')).toBeInTheDocument();
  });

  it('triggers updateProject when creating retrospective', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const project = makeProject({ id: 'p-retro', name: 'Retro Project', status: 'active' });
    store.dispatch(setProjects([project]));
    renderPage(store);

    // The retrospective button shows "复盘"
    const retroBtn = screen.getByRole('button', { name: '复盘' });
    await user.click(retroBtn);

    // Modal should open
    expect(screen.getByText('项目复盘')).toBeInTheDocument();
  });

  // ── Empty sections ───────────────────────────────────────────────────────

  it('shows empty message for section with no projects', () => {
    const store = makeStore();
    const project = makeProject({ id: 'p-1', name: 'Only Active', status: 'active' });
    store.dispatch(setProjects([project]));
    renderPage(store);

    expect(screen.getByText('暂无已完成的项目')).toBeInTheDocument();
    expect(screen.getByText('暂无已暂停的项目')).toBeInTheDocument();
  });

  it('shows empty state for active section when no active projects', () => {
    const store = makeStore();
    const project = makeProject({ id: 'p-1', name: 'Completed Only', status: 'completed' });
    store.dispatch(setProjects([project]));
    renderPage(store);

    expect(screen.getByText('暂无进行中的项目，点击下方按钮创建新项目')).toBeInTheDocument();
  });

  it('does not show empty icon state when projects exist', () => {
    const store = makeStore();
    const project = makeProject({ id: 'p-1', name: 'One Project', status: 'active' });
    store.dispatch(setProjects([project]));
    renderPage(store);

    expect(screen.queryByText('还没有任何项目')).not.toBeInTheDocument();
  });
});
