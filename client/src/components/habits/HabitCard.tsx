import { Habit, HabitLogStatus } from '../../types/habits';
import { HabitLogButtons } from './HabitLogButtons';

interface HabitCardProps {
  habit: Habit;
  todayLog?: HabitLogStatus | null;
  onLog: (habitId: string, status: HabitLogStatus) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export function HabitCard({ habit, todayLog, onLog, onEdit, onDelete }: HabitCardProps) {
  const isDoneToday = todayLog === 'done';

  const getFrequencyLabel = (freq: string, rule: Habit['repeatRule']) => {
    switch (freq) {
      case 'daily': return 'Daily';
      case 'weekly': {
        if (rule.daysOfWeek && rule.daysOfWeek.length > 0) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          return rule.daysOfWeek.map((d: number) => days[d]).join(', ');
        }
        return 'Weekly';
      }
      case 'monthly': return 'Monthly';
      default: return 'Custom';
    }
  };

  return (
    <div className="habit-card" style={{
      background: 'var(--color-surface)',
      border: '1px solid var(--color-border)',
      borderRadius: '12px',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      opacity: isDoneToday ? 0.7 : 1,
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: '0 0 4px', fontSize: '1.125rem', fontWeight: 600 }}>
            {habit.name}
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
            <span>{getFrequencyLabel(habit.targetFrequency, habit.repeatRule)}</span>
            {habit.linkedGoalId && <span>🎯 Linked to goal</span>}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => onEdit(habit)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-muted)',
              cursor: 'pointer', padding: '4px', borderRadius: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-border)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            ✏️
          </button>
          <button
            onClick={() => onDelete(habit.id)}
            style={{
              background: 'none', border: 'none', color: 'var(--color-text-muted)',
              cursor: 'pointer', padding: '4px', borderRadius: '4px',
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(239,68,68,0.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'none'; }}
          >
            🗑️
          </button>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '2rem', fontWeight: 700, color: isDoneToday ? 'var(--color-success)' : 'var(--color-primary)' }}>
            {habit.currentStreak}
          </span>
          <span style={{ color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>🔥 day streak</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          <span>Best: {habit.bestStreak}</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>✅ {habit.completionCount}</span>
          <span style={{ margin: '0 8px' }}>|</span>
          <span>❌ {habit.missedCount}</span>
        </div>
      </div>

      <HabitLogButtons
        habitId={habit.id}
        todayLog={todayLog ?? undefined}
        onLog={(status: HabitLogStatus) => onLog(habit.id, status)}
        disabled={isDoneToday}
      />
    </div>
  );
}