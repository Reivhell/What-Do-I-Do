import { useState, useMemo } from 'react';
import { AchievementCard } from './AchievementCard';
import type { AchievementWithProgress } from '../../types/achievements';

interface AchievementGridProps {
  achievements: AchievementWithProgress[];
}

const CATEGORIES = ['all', 'activity', 'habits', 'goals', 'planner', 'money', 'loyalty'] as const;

export function AchievementGrid({ achievements }: AchievementGridProps) {
  const [activeCategory, setActiveCategory] = useState<string>('all');

  const filtered = useMemo(
    () =>
      activeCategory === 'all'
        ? achievements
        : achievements.filter(a => a.category === activeCategory),
    [achievements, activeCategory],
  );

  return (
    <div>
      {/* Category tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`
              font-body text-xs font-semibold uppercase tracking-wide px-4 py-2 rounded-xl
              transition-all duration-200 whitespace-nowrap
              ${activeCategory === cat
                ? 'bg-ink-900 text-white dark:bg-white dark:text-ink-900'
                : 'clay-l1 text-ink-500 hover:text-ink-700'
              }
            `}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {filtered.map(a => (
          <AchievementCard key={a.id} achievement={a} />
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center font-body text-sm text-ink-400 py-12">
          No achievements in this category yet.
        </p>
      )}
    </div>
  );
}
