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
    <div className="habit-streaks" style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
      <div className="streak-current" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="streak-label" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Current</span>
        <span className="streak-value" style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--color-primary)' }}>
          {current}
        </span>
        <span className="streak-fire" style={{ fontSize: '1.25rem' }}>🔥</span>
      </div>
      <div className="streak-best" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <span className="streak-label" style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Best</span>
        <span className="streak-value" style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text)' }}>
          {best}
        </span>
        <span className="streak-trophy" style={{ fontSize: '1rem' }}>🏆</span>
      </div>
      <div className="streak-rate" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
        <span className="streak-label" style={{ fontSize: '0.7rem', color: 'var(--color-text-muted)', textTransform: 'uppercase' }}>Rate</span>
        <span className="streak-value" style={{ fontSize: '0.875rem', fontWeight: 500, color: rate >= 70 ? 'var(--color-success)' : rate >= 40 ? 'var(--color-warning)' : 'var(--color-danger)' }}>
          {rate}%
        </span>
      </div>
    </div>
  );
}