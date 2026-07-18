import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Select } from '../../../src/components/ui/Select';

describe('Select', () => {
  const options = [
    { value: 'a', label: 'Option A' },
    { value: 'b', label: 'Option B' },
  ];

  it('renders options', () => {
    render(<Select options={options} />);
    expect(screen.getByText('Option A')).toBeInTheDocument();
    expect(screen.getByText('Option B')).toBeInTheDocument();
  });

  it('renders with label', () => {
    render(<Select label="Category" options={options} />);
    expect(screen.getByLabelText('Category')).toBeInTheDocument();
  });

  it('selection triggers onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Select label="Category" options={options} onChange={onChange} />);
    await user.selectOptions(screen.getByLabelText('Category'), 'b');
    expect(onChange).toHaveBeenCalled();
  });
});
