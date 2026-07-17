import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Card, CardTitle } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card><p>Card content</p></Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('renders with a title via CardTitle', () => {
    render(
      <Card>
        <CardTitle>My Title</CardTitle>
        <p>Body</p>
      </Card>,
    );
    expect(screen.getByRole('heading', { name: /my title/i })).toBeInTheDocument();
    expect(screen.getByText('Body')).toBeInTheDocument();
  });

  it('renders with level 2 variant', () => {
    const { container } = render(<Card level={2}>Level 2 card</Card>);
    expect(container.firstChild).toBeInTheDocument();
    expect(screen.getByText('Level 2 card')).toBeInTheDocument();
  });
});
