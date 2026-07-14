interface AchievementsHeaderProps {
  totalUnlocked: number;
  totalAchievements: number;
  level: number;
}

export function AchievementsHeader({ totalUnlocked, totalAchievements, level }: AchievementsHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-6">
      <div>
        <h2 className="font-display text-2xl font-bold text-ink-900">Achievements</h2>
        <p className="font-body text-sm text-ink-400 mt-0.5">
          {totalUnlocked} / {totalAchievements} unlocked
        </p>
      </div>
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 clay-l1 rounded-xl px-4 py-2">
          <span className="text-xl">⭐</span>
          <div className="text-left">
            <p className="font-display text-xs text-ink-400 uppercase tracking-wide">Level</p>
            <p className="font-display text-lg font-bold text-ink-900 -mt-0.5">{level}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
