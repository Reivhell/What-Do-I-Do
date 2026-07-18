import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { MemoryRouter } from 'react-router-dom';
import { MobileNav } from '../../../src/components/layout/MobileNav';

describe('MobileNav', () => {
  it('renders navigation items', () => {
    render(
      <MemoryRouter>
        <MobileNav />
      </MemoryRouter>
    );
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Tasks')).toBeInTheDocument();
  });
});
