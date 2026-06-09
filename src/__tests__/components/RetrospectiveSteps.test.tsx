import { configureStore } from '@reduxjs/toolkit';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, test, expect, vi } from 'vitest';

import WizardProgress from '../../features/retrospective/components/WizardProgress';
import StepSelectCapabilities from '../../features/retrospective/components/StepSelectCapabilities';
import StepFreeRetrospective from '../../features/retrospective/components/StepFreeRetrospective';
import StepExtractExperience from '../../features/retrospective/components/StepExtractExperience';
import StepCapabilityPreview from '../../features/retrospective/components/StepCapabilityPreview';
import capabilityReducer from '../../features/capabilities/store/capabilitySlice';
import type { WizardStep, CapabilityImpact, WizardExperience } from '../../features/retrospective/types/retrospectiveTypes';

vi.mock('../../shared/utils/secureStorage', () => ({
  secureStorage: {
    getItem: vi.fn(() => null),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
}));

// ===== WizardProgress Tests =====

describe('WizardProgress', () => {
  const defaultProps = {
    currentStep: 'capabilities' as WizardStep,
    completedSteps: [] as WizardStep[],
    onStepClick: vi.fn(),
  };

  test('renders all 4 steps in order with correct labels', () => {
    render(<WizardProgress {...defaultProps} />);
    expect(screen.getByText('选择能力')).toBeInTheDocument();
    expect(screen.getByText('自由回顾')).toBeInTheDocument();
    expect(screen.getByText('提炼经验')).toBeInTheDocument();
    expect(screen.getByText('确认变化')).toBeInTheDocument();
  });

  test('current step is highlighted with indigo circle', () => {
    render(<WizardProgress {...defaultProps} currentStep="retrospective" />);
    const indigoCircle = screen.getByText('2').closest('div');
    expect(indigoCircle).toHaveClass('bg-indigo-600');
    const labelSpan = screen.getByText('自由回顾');
    expect(labelSpan).toHaveClass('text-indigo-600');
  });

  test('completed steps show green checkmark and are clickable', () => {
    render(
      <WizardProgress
        {...defaultProps}
        currentStep="experiences"
        completedSteps={['capabilities', 'retrospective']}
      />,
    );
    // Completed steps show ✓ (two of them)
    const checkmarks = screen.getAllByText('✓');
    expect(checkmarks).toHaveLength(2);
    // Check the first step button is enabled
    const buttons = screen.getAllByRole('button');
    expect(buttons[0]).not.toBeDisabled();
  });

  test('completed steps trigger onStepClick when clicked', () => {
    const handleClick = vi.fn();
    render(
      <WizardProgress
        {...defaultProps}
        currentStep="preview"
        completedSteps={['capabilities', 'retrospective', 'experiences']}
        onStepClick={handleClick}
      />,
    );
    const buttons = screen.getAllByRole('button');
    // Click the first completed step
    fireEvent.click(buttons[0]);
    expect(handleClick).toHaveBeenCalledWith('capabilities');
  });

  test('connectors between steps are colored correctly (indigo for completed, gray for pending)', () => {
    const { container } = render(
      <WizardProgress
        {...defaultProps}
        currentStep="experiences"
        completedSteps={['capabilities', 'retrospective']}
      />,
    );
    const connectors = container.querySelectorAll('.h-0\\.5');
    // First connector (between step 1 and 2) should be indigo (completed)
    expect(connectors[0]).toHaveClass('bg-indigo-500');
    // Second connector (between step 2 and 3) should be indigo (completed up to current)
    expect(connectors[1]).toHaveClass('bg-indigo-500');
    // Third connector (between step 3 and 4) should be gray (pending)
    expect(connectors[2]).toHaveClass('bg-gray-200');
  });
});

// ===== StepSelectCapabilities Tests =====

describe('StepSelectCapabilities', () => {
  function makeStore(capabilities: any[] = []) {
    return configureStore({
      reducer: {
        capabilities: capabilityReducer,
      },
      preloadedState: {
        capabilities: { capabilities, isLoading: false, error: null },
      },
    });
  }

  function renderWithStore(capabilities: any[], selected: string[], onChange: (ids: string[]) => void) {
    const store = makeStore(capabilities);
    const result = render(
      <Provider store={store}>
        <StepSelectCapabilities selected={selected} onChange={onChange} />
      </Provider>,
    );
    return { ...result, store };
  }

  const mockCapabilities = [
    { id: 'cap1', userId: 'u1', name: 'TypeScript', category: 'skill', parentId: null, currentLevel: 70, targetLevel: 90, growthRate: 0 },
    { id: 'cap2', userId: 'u1', name: 'React', category: 'skill', parentId: null, currentLevel: 60, targetLevel: 80, growthRate: 0 },
    { id: 'cap3', userId: 'u1', name: '沟通', category: 'softSkill', parentId: null, currentLevel: 50, targetLevel: 70, growthRate: 0 },
  ];

  test('shows empty state when no capabilities exist', () => {
    renderWithStore([], [], vi.fn());
    expect(screen.getByText('暂无能力')).toBeInTheDocument();
    expect(screen.getByText('请先在能力管理中创建能力')).toBeInTheDocument();
  });

  test('renders capabilities grouped by category with checkboxes', () => {
    renderWithStore(mockCapabilities, [], vi.fn());
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('沟通')).toBeInTheDocument();
    expect(screen.getByText('Lv.70')).toBeInTheDocument();
    expect(screen.getByText('Lv.60')).toBeInTheDocument();
    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes).toHaveLength(3);
  });

  test('toggling a capability calls onChange with updated selection', () => {
    const handleChange = vi.fn();
    renderWithStore(mockCapabilities, ['cap1'], handleChange);
    const checkboxes = screen.getAllByRole('checkbox');
    // Click the second checkbox (React)
    fireEvent.click(checkboxes[1]);
    expect(handleChange).toHaveBeenCalledWith(['cap1', 'cap2']);
  });

  test('selected capabilities show highlighted styling (bg-indigo-50)', () => {
    renderWithStore(mockCapabilities, ['cap1'], vi.fn());
    const typeScriptLabel = screen.getByText('TypeScript').closest('label');
    expect(typeScriptLabel).toHaveClass('bg-indigo-50');
    expect(typeScriptLabel).toHaveClass('border-indigo-200');
  });
});

// ===== StepFreeRetrospective Tests =====

describe('StepFreeRetrospective', () => {
  const defaultProps = {
    whatWentWell: [] as string[],
    whatWentWrong: [] as string[],
    nextTime: [] as string[],
    onChange: vi.fn(),
  };

  test('renders 3 textareas for well/wrong/next', () => {
    render(<StepFreeRetrospective {...defaultProps} />);
    const textareas = screen.getAllByRole('textbox');
    expect(textareas).toHaveLength(3);
    expect(screen.getByText('做得好的（每行一条）')).toBeInTheDocument();
    expect(screen.getByText('需要改进的（每行一条）')).toBeInTheDocument();
    expect(screen.getByText('下次注意（每行一条）')).toBeInTheDocument();
  });

  test('typing in textarea calls onChange with split arrays (filter empty lines)', () => {
    const handleChange = vi.fn();
    render(<StepFreeRetrospective {...defaultProps} onChange={handleChange} />);
    const textareas = screen.getAllByRole('textbox');
    // Type in the first textarea
    fireEvent.change(textareas[0], { target: { value: 'Good thing 1\n\nGood thing 2\n' } });
    expect(handleChange).toHaveBeenCalledWith({
      whatWentWell: ['Good thing 1', 'Good thing 2'],
      whatWentWrong: [],
      nextTime: [],
    });
  });

  test('shows count of items below each textarea', () => {
    render(
      <StepFreeRetrospective
        whatWentWell={['item1', 'item2']}
        whatWentWrong={['wrong1']}
        nextTime={[]}
        onChange={vi.fn()}
      />,
    );
    const counts = screen.getAllByText(/\d+ 条/);
    expect(counts[0]).toHaveTextContent('2 条');
    expect(counts[1]).toHaveTextContent('1 条');
    expect(counts[2]).toHaveTextContent('0 条');
  });
});

// ===== StepExtractExperience Tests =====

describe('StepExtractExperience', () => {
  const emptyExperience: WizardExperience = {
    event: '',
    reflection: '',
    principle: '',
    capabilityLinks: [],
  };

  const defaultProps = {
    experiences: [] as WizardExperience[],
    capabilitiesUsed: ['cap1'] as string[],
    capabilityNames: new Map([['cap1', 'TypeScript']]) as Map<string, string>,
    onChange: vi.fn(),
  };

  test('renders with at least one experience item (shows empty if none provided)', () => {
    render(<StepExtractExperience {...defaultProps} />);
    // The label is rendered as text followed by " *"
    expect(screen.getByText(/经验描述/)).toBeInTheDocument();
    // Should show input fields for the default empty experience
    const inputs = screen.getAllByRole('textbox');
    expect(inputs.length).toBeGreaterThanOrEqual(1);
  });

  test('adding item increases item count', () => {
    const handleChange = vi.fn();
    render(
      <StepExtractExperience {...defaultProps} onChange={handleChange} />,
    );
    const addButton = screen.getByText('+ 添加更多经验');
    fireEvent.click(addButton);
    // onChange should be called with 2 items
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith([
      emptyExperience,
      emptyExperience,
    ]);
  });

  test('removing item decreases count (minimum 1 item - no remove button when only 1)', () => {
    const handleChange = vi.fn();
    const experiences: WizardExperience[] = [
      { ...emptyExperience, event: 'Event 1' },
      { ...emptyExperience, event: 'Event 2' },
    ];
    render(
      <StepExtractExperience {...defaultProps} experiences={experiences} onChange={handleChange} />,
    );
    // Should show remove buttons when more than 1 item
    const removeButtons = screen.getAllByText('×');
    expect(removeButtons.length).toBeGreaterThan(0);
    // Click the first remove button
    fireEvent.click(removeButtons[0]);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledWith([{ ...emptyExperience, event: 'Event 2' }]);
  });

  test('toggling capability link calls onChange with updated links', () => {
    const handleChange = vi.fn();
    const experiences: WizardExperience[] = [{ ...emptyExperience, event: 'Test event' }];
    render(
      <StepExtractExperience
        {...defaultProps}
        experiences={experiences}
        onChange={handleChange}
      />,
    );
    const capButton = screen.getByText('TypeScript');
    fireEvent.click(capButton);
    expect(handleChange).toHaveBeenCalledTimes(1);
    const updatedExperiences = handleChange.mock.calls[0][0];
    expect(updatedExperiences[0].capabilityLinks).toEqual([
      { capabilityId: 'cap1', contribution: 0.5 },
    ]);
  });
});

// ===== StepCapabilityPreview Tests =====

describe('StepCapabilityPreview', () => {
  test('shows empty message when no impacts', () => {
    render(<StepCapabilityPreview impacts={[]} />);
    expect(screen.getByText('本次复盘未产生能力等级变化')).toBeInTheDocument();
  });

  test('renders impact with capability name, level change, and progress bar', () => {
    const impacts: CapabilityImpact[] = [
      {
        capabilityId: 'cap1',
        capabilityName: 'TypeScript',
        oldLevel: 60,
        newLevel: 70,
        change: 10,
        reason: 'positive: 3; negative: 1; change: 10',
      },
    ];
    render(<StepCapabilityPreview impacts={impacts} />);
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    // i18n mock doesn't interpolate, so renders literal template
    expect(screen.getByText('+{{change}}')).toBeInTheDocument();
    expect(screen.getByText('Lv.60')).toBeInTheDocument();
    expect(screen.getByText('Lv.70')).toBeInTheDocument();
    // Check progress bar exists
    const progressBar = document.querySelector('[style*="width"]');
    expect(progressBar).toHaveStyle({ width: '70%' });
  });

  test('parses reason string and shows description text', () => {
    const impacts: CapabilityImpact[] = [
      {
        capabilityId: 'cap1',
        capabilityName: 'React',
        oldLevel: 50,
        newLevel: 55,
        change: 5,
        reason: 'positive: 2; negative: 1; change: 5',
      },
    ];
    render(<StepCapabilityPreview impacts={impacts} />);
    // i18n mock doesn't interpolate placeholders, so renders literal text
    expect(
      screen.getByText('{{count}} 条正面回顾，{{count}} 条改进项，等级 +{{change}}'),
    ).toBeInTheDocument();
  });
});
