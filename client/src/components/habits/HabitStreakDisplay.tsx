interface HabitStreakDisplayProps {
  current: number;
  best: number;
  completionCount: number;
  missedCount: number;
}

export function HabitStreakDisplay({ current, best, completionCount, missedCount }: HabitStreakDisplayProps) {
  const total = completionCount + missedCount;
  const rate = total > 0 ? Math.round((completionCount / total) * 100) : 0;

  return (
    <div className="flex items-center justify-between gap-4 bg-clay-surface-alt clay-inset rounded-[--radius-md] p-3">
      {/* Current streak */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-body text-[11px] text-ink-500 uppercase tracking-wider">Streak</span>
        <span className="font-display text-2xl font-bold text-blue-600">
          {current}
        </span>
        <span className="text-sm">🔥</span>
      </div>

      {/* Best streak */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-body text-[11px] text-ink-500 uppercase tracking-wider">Best</span>
        <span className="font-display text-lg font-semibold text-ink-900">{best}</span>
        <span className="text-sm">🏆</span>
      </div>

      {/* Divider */}
      <div className="h-10 w-px bg-ink-200/20" />

      {/* Completion rate */}
      <div className="flex flex-col items-center gap-0.5">
        <span className="font-body text-[11px] text-ink-500 uppercase tracking-wider">Rate</span>
        <span className={`font-display text-lg font-semibold ${
          rate >= 70 ? 'text-semantic-green' : rate >= 40 ? 'text-semantic-amber' : 'text-semantic-red'
        }`}>
          {rate}%
        </span>
        <span className="text-[11px] text-ink-400">{completionCount}/{total}</span>
      </div>
    </div>
  );
}
