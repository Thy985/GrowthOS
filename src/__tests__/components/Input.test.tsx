import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

import Input from '../../shared/components/common/Input.tsx';

describe('Input', () => {
  it('renders input', () => {
    render(<Input placeholder="enter name" />);
    expect(screen.getByPlaceholderText('enter name')).toBeInTheDocument();
  });

  it('forwards value and onChange', () => {
    const onChange = vi.fn();
    render(<Input value="hi" onChange={onChange} />);
    const input = screen.getByDisplayValue('hi');
    fireEvent.change(input, { target: { value: 'bye' } });
    expect(onChange).toHaveBeenCalled();
  });

  it('shows helper text', () => {
    render(<Input helperText="hint here" />);
    expect(screen.getByText('hint here')).toBeInTheDocument();
  });

  it('shows error text', () => {
    render(<Input error="error here" />);
    expect(screen.getByText('error here')).toBeInTheDocument();
  });

  it('is disabled when disabled', () => {
    render(<Input disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
