import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';

import Textarea from '../../shared/components/common/Textarea.tsx';

describe('Textarea', () => {
  it('renders textarea with value', () => {
    render(<Textarea value="hi" onChange={() => {}} />);
    expect(screen.getByDisplayValue('hi')).toBeInTheDocument();
  });

  it('applies rows prop', () => {
    const { container } = render(<Textarea rows={5} />);
    const textarea = container.querySelector('textarea');
    expect(textarea?.getAttribute('rows')).toBe('5');
  });

  it('applies placeholder', () => {
    render(<Textarea placeholder="enter notes" />);
    expect(screen.getByPlaceholderText('enter notes')).toBeInTheDocument();
  });

  it('is disabled when disabled', () => {
    render(<Textarea disabled />);
    expect(screen.getByRole('textbox')).toBeDisabled();
  });
});
