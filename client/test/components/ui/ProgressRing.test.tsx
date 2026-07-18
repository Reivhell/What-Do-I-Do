import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ProgressRing } from '../../../src/components/ui/ProgressRing';

describe('ProgressRing', () => {
  it('shows correct percentage', () => {
    render(<ProgressRing value={75} />);
    expect(screen.getByText('75%')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuenow', '75');
  });
});
