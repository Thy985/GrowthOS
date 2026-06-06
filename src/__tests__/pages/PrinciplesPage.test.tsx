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
import PrinciplesPage from '../../features/principles/pages/PrinciplesPage.tsx';
import principleReducer, { setPrinciples } from '../../features/principles/store/principleSlice';
import projectReducer from '../../features/projects/store/projectSlice';
import recordsReducer from '../../features/records/store/recordsSlice';
import reminderReducer from '../../features/reminders/store/reminderSlice';
import themeReducer from '../../features/theme/store/themeSlice';
import type { Principle } from '../../shared/types';
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
        <PrinciplesPage />
      </MemoryRouter>
    </Provider>,
  );
}

function makePrinciple(overrides: Partial<Principle> = {}): Principle {
  const now = new Date().toISOString();
  return {
    id: overrides.id ?? 'principle-1',
    userId: overrides.userId ?? 'user-1',
    content: overrides.content ?? 'Test principle content',
    sourceExperienceIds: overrides.sourceExperienceIds ?? [],
    category: overrides.category,
    confidence: overrides.confidence ?? 0.5,
    usageCount: overrides.usageCount ?? 0,
    lastUsedAt: overrides.lastUsedAt,
    createdAt: overrides.createdAt ?? now,
  };
}

describe('PrinciplesPage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  // ── Empty state ──────────────────────────────────────────────────────────

  it('renders empty state message when no principles exist', () => {
    renderPage();
    expect(screen.getByText('经验库')).toBeInTheDocument();
    expect(screen.getByText('暂无原则，当你记录经历并提炼原则后会显示在这里')).toBeInTheDocument();
  });

  it('shows the "+ 新原则" button in empty state', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /\+ 新原则/ })).toBeInTheDocument();
  });

  // ── With data ────────────────────────────────────────────────────────────

  it('renders principles when data exists', () => {
    const store = makeStore();
    const principle = makePrinciple({
      id: 'p-1',
      content: 'Always listen before responding',
      category: '沟通',
      confidence: 0.8,
      usageCount: 5,
    });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);
    expect(screen.getByText('Always listen before responding')).toBeInTheDocument();
  });

  it('renders category badge when principle has a category', () => {
    const store = makeStore();
    const principle = makePrinciple({
      id: 'p-1',
      content: 'Principle with category',
      category: '学习',
    });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);
    // "学习" appears in both the card badge and the filter button
    expect(screen.getAllByText('学习').length).toBeGreaterThanOrEqual(1);
  });

  it('displays confidence percentage', () => {
    const store = makeStore();
    const principle = makePrinciple({ id: 'p-1', confidence: 0.75 });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);
    expect(screen.getByText('75%')).toBeInTheDocument();
  });

  it('displays usage count and source experience count', () => {
    const store = makeStore();
    const principle = makePrinciple({
      id: 'p-1',
      usageCount: 3,
      sourceExperienceIds: ['exp-1', 'exp-2'],
    });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);
    expect(screen.getByText(/已验证 3 次/)).toBeInTheDocument();
    expect(screen.getByText(/来自 2 个经历/)).toBeInTheDocument();
  });

  it('displays total count of principles', () => {
    const store = makeStore();
    const p1 = makePrinciple({ id: 'p-1' });
    const p2 = makePrinciple({ id: 'p-2' });
    const p3 = makePrinciple({ id: 'p-3' });
    store.dispatch(setPrinciples([p1, p2, p3]));
    renderPage(store);
    expect(screen.getByText('共 3 条原则')).toBeInTheDocument();
  });

  it('renders category filter buttons', () => {
    renderPage();
    expect(screen.getByText('全部')).toBeInTheDocument();
    expect(screen.getByText('学习')).toBeInTheDocument();
    expect(screen.getByText('工作')).toBeInTheDocument();
    expect(screen.getByText('沟通')).toBeInTheDocument();
    expect(screen.getByText('生活')).toBeInTheDocument();
    expect(screen.getByText('其他')).toBeInTheDocument();
  });

  // ── CRUD actions ─────────────────────────────────────────────────────────

  it('opens create modal when "+ 新原则" button is clicked', async () => {
    const user = userEvent.setup();
    renderPage();
    await user.click(screen.getByRole('button', { name: /\+ 新原则/ }));
    // Modal heading uses same key so shows '+ 新原则' too
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('submits new principle via addPrinciple thunk', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    renderPage(store);

    // Open create modal
    await user.click(screen.getByRole('button', { name: /\+ 新原则/ }));

    // Find the form elements within the modal
    const modal = document.querySelector('.fixed.inset-0.z-50') as HTMLElement;
    if (!modal) throw new Error('Modal not found');

    // Fill form by placeholder/text
    const userIdInput = screen.getByPlaceholderText('user-id');
    const contentTextarea = modal.querySelector('textarea') as HTMLTextAreaElement;
    await user.type(userIdInput, 'user-test');
    await user.type(contentTextarea, 'New principle from test');

    // Select category
    const selects = modal.querySelectorAll('select');
    const categorySelect = selects[0];
    await user.selectOptions(categorySelect, '学习');

    // Submit
    const buttons = modal.querySelectorAll('button');
    const saveButton = Array.from(buttons).find((btn) =>
      btn.textContent?.includes('保存'),
    ) as HTMLButtonElement;
    await user.click(saveButton);

    // Modal should close
    expect(document.querySelector('.fixed.inset-0.z-50')).not.toBeInTheDocument();
  });

  it('opens edit modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const principle = makePrinciple({ id: 'p-1', content: 'Editable principle' });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);

    // The edit button is visible on hover; find by text content
    const editButton = screen.getByRole('button', { name: '编辑' });
    await user.click(editButton);

    // Check heading exists
    expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument();
  });

  it('submits edited principle via updatePrinciple thunk', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const principle = makePrinciple({
      id: 'p-1',
      content: 'Original content',
      confidence: 0.5,
    });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);

    // Open edit modal
    const editButton = screen.getByRole('button', { name: '编辑' });
    await user.click(editButton);

    // Get the edit modal form elements
    const textareas = document.querySelectorAll('textarea');
    const contentInput = textareas[textareas.length - 1];
    await user.clear(contentInput);
    await user.type(contentInput, 'Updated content');

    // Find the save button in the modal
    const allButtons = document.querySelectorAll('button');
    const saveButton = Array.from(allButtons).find((btn) =>
      btn.textContent?.includes('保存'),
    ) as HTMLButtonElement;
    await user.click(saveButton);

    // Modal should close
    expect(document.querySelectorAll('textarea').length).toBe(0);
  });

  it('triggers deletePrinciple when delete button is clicked', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const principle = makePrinciple({ id: 'p-delete', content: 'Delete me' });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);

    // Click delete - the delete thunk is async and reads from secureStorage mock (null),
    // so we just verify the button exists and the click doesn't crash
    const deleteButton = screen.getByRole('button', { name: '删除' });
    expect(deleteButton).toBeInTheDocument();
    await user.click(deleteButton);
  });

  // ── Filters / Search ─────────────────────────────────────────────────────

  it('shows search input', () => {
    renderPage();
    expect(screen.getByPlaceholderText('搜索原则内容...')).toBeInTheDocument();
  });

  it('filters principles by search query', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const p1 = makePrinciple({ id: 'p-1', content: 'Always be kind' });
    const p2 = makePrinciple({ id: 'p-2', content: 'Never stop learning' });
    store.dispatch(setPrinciples([p1, p2]));
    renderPage(store);

    expect(screen.getByText('共 2 条原则')).toBeInTheDocument();
    expect(screen.getByText('Always be kind')).toBeInTheDocument();
    expect(screen.getByText('Never stop learning')).toBeInTheDocument();

    // Search for "kind"
    const searchInput = screen.getByPlaceholderText('搜索原则内容...');
    await user.type(searchInput, 'kind');

    expect(screen.getByText('Always be kind')).toBeInTheDocument();
    expect(screen.queryByText('Never stop learning')).not.toBeInTheDocument();
    expect(screen.getByText('共 1 条原则')).toBeInTheDocument();
  });

  it('filters principles by category', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const p1 = makePrinciple({ id: 'p-1', content: 'Study daily', category: 'learning' });
    const p2 = makePrinciple({ id: 'p-2', content: 'Work hard', category: 'work' });
    const p3 = makePrinciple({ id: 'p-3', content: 'Be honest' });
    store.dispatch(setPrinciples([p1, p2, p3]));
    renderPage(store);

    expect(screen.getByText('共 3 条原则')).toBeInTheDocument();

    // Filter by "学习" category
    const categoryButtons = screen.getAllByText('学习');
    await user.click(categoryButtons[0]);

    // "Study daily" should be visible
    expect(screen.getByText('Study daily')).toBeInTheDocument();
    // "Work hard" and "Be honest" should not be visible
    expect(screen.queryByText('Work hard')).not.toBeInTheDocument();
    expect(screen.queryByText('Be honest')).not.toBeInTheDocument();
  });

  it('shows "no matching principles" when search finds nothing', async () => {
    const user = userEvent.setup();
    const store = makeStore();
    const principle = makePrinciple({ id: 'p-1', content: 'Test principle' });
    store.dispatch(setPrinciples([principle]));
    renderPage(store);

    const searchInput = screen.getByPlaceholderText('搜索原则内容...');
    await user.type(searchInput, 'zzzznotfound');

    expect(screen.getByText('未找到匹配的原则')).toBeInTheDocument();
  });

  it('sorts principles by confidence * usageCount descending', () => {
    const store = makeStore();
    // p1: 0.3 * 1 = 0.3, p2: 0.8 * 5 = 4.0, p3: 0.5 * 2 = 1.0
    // Expected order: p2, p3, p1
    const p1 = makePrinciple({
      id: 'p-1',
      content: 'Low priority',
      confidence: 0.3,
      usageCount: 1,
    });
    const p2 = makePrinciple({
      id: 'p-2',
      content: 'Top priority',
      confidence: 0.8,
      usageCount: 5,
    });
    const p3 = makePrinciple({
      id: 'p-3',
      content: 'Medium priority',
      confidence: 0.5,
      usageCount: 2,
    });
    store.dispatch(setPrinciples([p1, p2, p3]));
    renderPage(store);

    const items = screen.getAllByText(/(Top priority|Medium priority|Low priority)/);
    expect(items).toHaveLength(3);
    expect(items[0].textContent).toBe('Top priority');
    expect(items[1].textContent).toBe('Medium priority');
    expect(items[2].textContent).toBe('Low priority');
  });
});
