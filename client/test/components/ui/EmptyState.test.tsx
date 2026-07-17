import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { EmptyState } from '../../../src/components/ui/EmptyState';

describe('EmptyState', () => {
  it('shows icon, title, and description', () => {
    render(<EmptyState icon={<span>📦</span>} title="Nothing here" description="Add something to get started" />);
    expect(screen.getByText('📦')).toBeInTheDocument();
    expect(screen.getByText('Nothing here')).toBeInTheDocument();
    expect(screen.getByText('Add something to get started')).toBeInTheDocument();
  });
});
