import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Toggle } from '../../../src/components/ui/Toggle';

describe('Toggle', () => {
  it('shows label', () => {
    render(<Toggle label="Dark mode" />);
    expect(screen.getByText('Dark mode')).toBeInTheDocument();
  });

  it('calls onChange on click', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<Toggle label="Dark mode" onChange={onChange} />);
    await user.click(screen.getByLabelText('Dark mode'));
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});
