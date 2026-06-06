import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Select from '../../shared/components/common/Select.tsx';

const options = [
  { value: 'a', label: 'Option A' },
  { value: 'b', label: 'Option B' },
];

describe('Select', () => {
  it('renders options and label', () => {
    render(<Select options={options} label="Choose one" />);
    expect(screen.getByText('Choose one')).toBeInTheDocument();
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('forwards value and disabled', () => {
    render(<Select options={options} value="a" disabled />);
    const select = screen.getByRole('combobox') as HTMLSelectElement;
    expect(select.value).toBe('a');
    expect(select).toBeDisabled();
  });

  it('shows helper text', () => {
    render(<Select options={options} helperText="choose wisely" />);
    expect(screen.getByText('choose wisely')).toBeInTheDocument();
  });

  it('shows error text', () => {
    render(<Select options={options} error="err" />);
    expect(screen.getByText('err')).toBeInTheDocument();
  });
});
