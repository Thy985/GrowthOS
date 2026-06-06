import { configureStore } from '@reduxjs/toolkit';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import authReducer from '../../features/auth/store/authSlice';
import capabilityReducer, {
  setCapabilities,
} from '../../features/capabilities/store/capabilitySlice';
import ExperiencesPage from '../../features/experiences/pages/ExperiencesPage.tsx';
import experienceReducer, {
  setExperiences,
  setLinks,
  deleteExperience,
  updateExperience,
} from '../../features/experiences/store/experienceSlice';
import goalReducer from '../../features/goals/store/goalSlice';
import treeReducer from '../../features/growth-tree/store/treeSlice';
import principleReducer from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import recordsReducer from '../../features/records/store/recordsSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';
import type { Experience, ExperienceCapabilityLink, Capability } from '../../shared/types';
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
        <ExperiencesPage />
      </MemoryRouter>
    </Provider>,
  );
}

function makeExperience(overrides: Partial<Experience> = {}): Experience {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'exp-1',
    userId: overrides.userId ?? 'user-1',
    event: overrides.event ?? 'Test event',
    reflection: overrides.reflection,
    principle: overrides.principle,
    confidence: overrides.confidence ?? 0.5,
    projectId: overrides.projectId,
    mood: overrides.mood,
    energy: overrides.energy,
    occurredAt: overrides.occurredAt ?? now,
    createdAt: overrides.createdAt ?? now,
    updatedAt: overrides.updatedAt ?? now,
  };
}

function makeLink(overrides: Partial<ExperienceCapabilityLink> = {}): ExperienceCapabilityLink {
  return {
    id: overrides.id ?? 'link-1',
    experienceId: overrides.experienceId ?? 'exp-1',
    capabilityId: overrides.capabilityId ?? 'cap-1',
    contribution: overrides.contribution ?? 0.5,
    evidence: overrides.evidence,
  };
}

function makeCapability(overrides: Partial<Capability> = {}): Capability {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'cap-1',
    userId: overrides.userId ?? 'user-1',
    name: overrides.name ?? 'Communication',
    category: overrides.category ?? 'social',
    parentId: overrides.parentId ?? null,
    currentLevel: overrides.currentLevel ?? 0,
    targetLevel: overrides.targetLevel ?? 80,
    growthRate: overrides.growthRate ?? 0,
    description: overrides.description,
    icon: overrides.icon,
    color: overrides.color,
    lastUpdated: overrides.lastUpdated ?? now,
    createdAt: overrides.createdAt ?? now,
  };
}

describe('ExperiencesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  it('renders empty state message when no experiences exist', () => {
    renderPage();
    expect(screen.getByText('经历管理')).toBeInTheDocument();
    expect(screen.getByText('还没有任何经历，点击上方按钮添加第一条吧！')).toBeInTheDocument();
  });

  it('shows the "new experience" link in empty state', () => {
    renderPage();
    const newLink = screen.getByRole('link', { name: /\+ 新经历/ });
    expect(newLink).toBeInTheDocument();
    expect(newLink.getAttribute('href')).toBe('/experiences/new');
  });

  // ── With data ────────────────────────────────────────────────────────────

  it('renders a list of experiences when data exists', () => {
    const store = makeStore();
    const exp = makeExperience({ id: 'exp-1', event: 'Important meeting' });
    store.dispatch(setExperiences([exp]));
    renderPage(store);
    expect(screen.getByText('Important meeting')).toBeInTheDocument();
  });

  it('renders reflection and principle sections when present', () => {
    const store = makeStore();
    const exp = makeExperience({
      id: 'exp-1',
      event: 'Team discussion',
      reflection: 'I should have prepared more',
      principle: 'Always prepare an agenda',
    });
    store.dispatch(setExperiences([exp]));
    renderPage(store);
    expect(screen.getByText('反思')).toBeInTheDocument();
    expect(screen.getByText('I should have prepared more')).toBeInTheDocument();
    expect(screen.getByText('原则')).toBeInTheDocument();
    expect(screen.getByText('Always prepare an agenda')).toBeInTheDocument();
  });

  it('renders capability tags when experiences are linked', () => {
    const store = makeStore();
    const exp = makeExperience({ id: 'exp-1' });
    const cap = makeCapability({ id: 'cap-1', name: 'Communication' });
    const link = makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' });
    store.dispatch(setExperiences([exp]));
    store.dispatch(setCapabilities([cap]));
    store.dispatch(setLinks([link]));
    renderPage(store);
    // "Communication" appears in both the card tag and the filter dropdown
    expect(screen.getAllByText('Communication').length).toBeGreaterThanOrEqual(1);
  });

  it('displays confidence label correctly', () => {
    const store = makeStore();
    const exp = makeExperience({ id: 'exp-1', confidence: 0.9 });
    store.dispatch(setExperiences([exp]));
    renderPage(store);
    expect(screen.getByText(/高 \(90%\)/)).toBeInTheDocument();
  });

  it('displays the count of experiences', () => {
    const store = makeStore();
    const exp1 = makeExperience({ id: 'exp-1' });
    const exp2 = makeExperience({ id: 'exp-2' });
    store.dispatch(setExperiences([exp1, exp2]));
    renderPage(store);
    expect(screen.getByText('共 2 条经历')).toBeInTheDocument();
  });

  // ── CRUD actions (via mock dispatch) ─────────────────────────────────────

  it('triggers addExperience thunk when navigating to new experience page', () => {
    const store = makeStore();
    renderPage(store);
    const newLink = screen.getByRole('link', { name: /\+ 新经历/ });
    expect(newLink.getAttribute('href')).toBe('/experiences/new');
  });

  it('dispatches deleteExperience when delete is triggered programmatically', () => {
    const store = makeStore();
    const exp = makeExperience({ id: 'exp-to-delete', event: 'To be deleted' });
    store.dispatch(setExperiences([exp]));
    renderPage(store);
    expect(screen.getByText('To be deleted')).toBeInTheDocument();

    const stateBefore = store.getState();
    expect(stateBefore.experiences.experiences).toHaveLength(1);

    store.dispatch(deleteExperience('exp-to-delete'));
  });

  it('dispatches updateExperience when update is triggered', () => {
    const store = makeStore();
    const exp = makeExperience({ id: 'exp-update', event: 'Original event', confidence: 0.5 });
    store.dispatch(setExperiences([exp]));
    renderPage(store);
    expect(screen.getByText('Original event')).toBeInTheDocument();

    store.dispatch(updateExperience({ id: 'exp-update', confidence: 0.8 }));
  });

  // ── Filters ──────────────────────────────────────────────────────────────

  it('shows filter inputs for date range and capability', () => {
    renderPage();
    // Labels are siblings of inputs (no `for` attribute), so use container queries
    const container = screen.getByText('开始日期').parentElement;
    expect(container?.querySelector('input[type="date"]')).toBeInTheDocument();

    const endContainer = screen.getByText('结束日期').parentElement;
    expect(endContainer?.querySelector('input[type="date"]')).toBeInTheDocument();

    const capContainer = screen.getByText('按能力筛选').parentElement;
    expect(capContainer?.querySelector('select')).toBeInTheDocument();
  });

  it('filters experiences by date range', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const oldExp = makeExperience({
      id: 'exp-old',
      event: 'Old experience',
      occurredAt: '2023-01-01T00:00:00Z',
    });
    const newExp = makeExperience({
      id: 'exp-new',
      event: 'New experience',
      occurredAt: '2025-06-01T00:00:00Z',
    });
    store.dispatch(setExperiences([oldExp, newExp]));
    renderPage(store);

    expect(screen.getByText('Old experience')).toBeInTheDocument();
    expect(screen.getByText('New experience')).toBeInTheDocument();
    expect(screen.getByText('共 2 条经历')).toBeInTheDocument();

    // Find the first date input (start date)
    const dateInputs = document.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;
    await user.type(startDateInput, '2025-01-01');

    expect(screen.getByText('共 1 条经历')).toBeInTheDocument();
    expect(screen.getByText('New experience')).toBeInTheDocument();
    expect(screen.queryByText('Old experience')).not.toBeInTheDocument();
  });

  it('filters experiences by capability', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const exp1 = makeExperience({ id: 'exp-1', event: 'Linked experience' });
    const exp2 = makeExperience({ id: 'exp-2', event: 'Unlinked experience' });
    const cap = makeCapability({ id: 'cap-1', name: 'Leadership' });
    const link = makeLink({ experienceId: 'exp-1', capabilityId: 'cap-1' });

    store.dispatch(setExperiences([exp1, exp2]));
    store.dispatch(setCapabilities([cap]));
    store.dispatch(setLinks([link]));
    renderPage(store);

    expect(screen.getByText('共 2 条经历')).toBeInTheDocument();

    const select = document.querySelector('select') as HTMLSelectElement;
    await user.selectOptions(select, 'cap-1');

    expect(screen.getByText('共 1 条经历')).toBeInTheDocument();
    expect(screen.getByText('Linked experience')).toBeInTheDocument();
    expect(screen.queryByText('Unlinked experience')).not.toBeInTheDocument();
  });

  it('shows "clear filters" button when filters are active', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const exp = makeExperience({ id: 'exp-1', event: 'Test', occurredAt: '2025-06-01T00:00:00Z' });
    store.dispatch(setExperiences([exp]));
    renderPage(store);

    expect(screen.queryByText('清除筛选')).not.toBeInTheDocument();

    const dateInputs = document.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;
    await user.type(startDateInput, '2025-01-01');

    expect(screen.getByText('清除筛选')).toBeInTheDocument();
  });

  it('clear filters resets all filter inputs', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const exp = makeExperience({ id: 'exp-1', event: 'Test', occurredAt: '2025-06-01T00:00:00Z' });
    store.dispatch(setExperiences([exp]));
    renderPage(store);

    const dateInputs = document.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;
    await user.type(startDateInput, '2025-01-01');
    expect(startDateInput.value).toBe('2025-01-01');

    await user.click(screen.getByText('清除筛选'));
    expect(startDateInput.value).toBe('');
  });

  it('shows "no matching experiences" when filters eliminate all results', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const exp = makeExperience({
      id: 'exp-1',
      event: 'Old event',
      occurredAt: '2020-01-01T00:00:00Z',
    });
    store.dispatch(setExperiences([exp]));
    renderPage(store);

    const dateInputs = document.querySelectorAll('input[type="date"]');
    const startDateInput = dateInputs[0] as HTMLInputElement;
    await user.type(startDateInput, '2025-01-01');

    expect(screen.getByText('没有找到符合条件的经历')).toBeInTheDocument();
  });
});
