import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { AchievementCard } from '../../../src/components/achievements/AchievementCard';
import type { AchievementWithProgress } from '../../../src/types/achievements';

const achievement: AchievementWithProgress = {
  id: 'a1',
  title: 'Early Bird',
  description: 'Complete 5 morning routines',
  requirementType: 'count',
  requirementValue: 5,
  icon: '🌅',
  category: 'habits',
  progress: 3,
  unlockedAt: null,
  userAchievementId: null,
};

describe('AchievementCard', () => {
  it('renders achievement title', () => {
    render(<AchievementCard achievement={achievement} />);
    expect(screen.getByText('Early Bird')).toBeInTheDocument();
  });
});
