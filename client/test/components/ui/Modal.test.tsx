import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { Modal } from '../../../src/components/ui/Modal';

describe('Modal', () => {
  it('renders children when open', () => {
    render(<Modal open onClose={vi.fn()}>Hello</Modal>);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<Modal open={false} onClose={vi.fn()}>Hello</Modal>);
    expect(screen.queryByText('Hello')).not.toBeInTheDocument();
  });

  it('calls onClose when close button clicked', async () => {
    const onClose = vi.fn();
    const user = userEvent.setup();
    render(<Modal open onClose={onClose} title="My Modal">Content</Modal>);
    await user.click(screen.getByLabelText('Close'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('renders title', () => {
    render(<Modal open onClose={vi.fn()} title="My Modal">Content</Modal>);
    expect(screen.getByText('My Modal')).toBeInTheDocument();
  });
});
