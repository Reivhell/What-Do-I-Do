import { useState, useEffect } from 'react';
import { AchievementsHeader, AchievementGrid } from '../components/achievements';
import { getAchievements } from '../api/achievements';
import type { AchievementWithProgress } from '../types/achievements';

export function AchievementsPage() {
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAchievements()
      .then(setAchievements)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const totalUnlocked = achievements.filter(a => a.unlockedAt).length;
  const level = Math.floor(totalUnlocked / 3) + 1;

  if (loading) {
    return (
      <div className="flex min-h-[60dvh] items-center justify-center">
        <div className="animate-pulse font-body text-sm text-ink-400">Loading achievements…</div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      <AchievementsHeader
        totalUnlocked={totalUnlocked}
        totalAchievements={achievements.length}
        level={level}
      />
      <AchievementGrid achievements={achievements} />
    </div>
  );
}
