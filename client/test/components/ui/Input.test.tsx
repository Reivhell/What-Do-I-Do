import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Input } from '../../../src/components/ui/Input';

describe('Input', () => {
  it('renders with label and placeholder', () => {
    render(<Input label="Name" placeholder="Enter name" />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Enter name')).toBeInTheDocument();
  });

  it('typing updates value via onChange', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Input label="Name" onChange={onChange} />);
    await user.type(screen.getByLabelText('Name'), 'Hello');
    expect(onChange).toHaveBeenCalled();
  });

  it('disables the input when disabled', () => {
    render(<Input label="Name" disabled />);
    expect(screen.getByLabelText('Name')).toBeDisabled();
  });

  it('shows error message', () => {
    render(<Input label="Name" error="Required" />);
    expect(screen.getByText('Required')).toBeInTheDocument();
  });

  it('shows hint text', () => {
    render(<Input label="Name" hint="Your full name" />);
    expect(screen.getByText('Your full name')).toBeInTheDocument();
  });

  it('loading sets aria-busy', () => {
    render(<Input label="Name" loading />);
    expect(screen.getByLabelText('Name')).toHaveAttribute('aria-busy', 'true');
  });
});
