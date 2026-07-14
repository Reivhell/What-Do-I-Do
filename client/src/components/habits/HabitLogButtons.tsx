import { HabitLogStatus } from '../../types/habits';

interface HabitLogButtonsProps {
  habitId: string;
  todayLog?: HabitLogStatus;
  onLog: (status: HabitLogStatus) => void;
  disabled?: boolean;
}

const statusConfig: Record<HabitLogStatus, { label: string; icon: string; color: string }> = {
  done: { label: 'Done', icon: '✓', color: 'var(--color-success)' },
  skipped: { label: 'Skip', icon: '⊘', color: 'var(--color-warning)' },
  missed: { label: 'Missed', icon: '✕', color: 'var(--color-danger)' },
};

export function HabitLogButtons({ habitId, todayLog, onLog, disabled }: HabitLogButtonsProps) {
  return (
    <div className="habit-log-buttons" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {(Object.keys(statusConfig) as HabitLogStatus[]).map(status => {
        const config = statusConfig[status];
        const isSelected = todayLog === status;
        return (
          <button
            key={status}
            onClick={() => onLog(status)}
            disabled={disabled || isSelected}
            className="habit-log-btn"
            style={{
              flex: 1,
              minWidth: '80px',
              padding: '12px 16px',
              border: `2px solid ${isSelected ? config.color : 'var(--color-border)'}`,
              borderRadius: '10px',
              background: isSelected ? `${config.color}20` : 'var(--color-surface)',
              color: isSelected ? config.color : 'var(--color-text)',
              fontWeight: isSelected ? 600 : 500,
              cursor: disabled || isSelected ? 'not-allowed' : 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              transition: 'all 0.15s ease',
              opacity: disabled || isSelected ? 0.7 : 1,
            }}
            title={isSelected ? `Already marked as ${config.label.toLowerCase()}` : `Mark as ${config.label.toLowerCase()}`}
          >
            <span style={{ fontSize: '1.25rem', lineHeight: 1 }}>{config.icon}</span>
            <span style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {config.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}