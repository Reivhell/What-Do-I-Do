import { Habit } from '../../types/habits';
import { HabitCard } from './HabitCard';
import { HabitForm } from './HabitForm';

interface HabitListProps {
  habits: Habit[];
  todayLogs: Record<string, 'done' | 'skipped' | 'missed' | null>;
  onLog: (habitId: string, status: 'done' | 'skipped' | 'missed') => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onCreate: (data: any) => void;
  isCreating?: boolean;
  isEditing?: Habit | null;
}

function habitToUpdateInput(habit: Habit) {
  return {
    name: habit.name,
    targetFrequency: habit.targetFrequency,
    repeatRule: habit.repeatRule,
    notes: habit.notes ?? undefined,
    linkedGoalId: habit.linkedGoalId ?? undefined,
  };
}

export function HabitList({
  habits,
  todayLogs,
  onLog,
  onEdit,
  onDelete,
  onCreate,
  isCreating,
  isEditing,
}: HabitListProps) {
  if (habits.length === 0) {
    return (
      <div className="habit-list-empty" style={{
        textAlign: 'center', padding: '48px 24px', color: 'var(--color-text-muted)',
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🌱</div>
        <h3 style={{ margin: '0 0 8px', fontSize: '1.25rem', color: 'var(--color-text)' }}>
          No habits yet
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: '0.875rem' }}>
          Start building consistency by creating your first habit
        </p>
        <button
          onClick={() => onCreate(null)}
          style={{
            padding: '12px 24px', borderRadius: '8px', border: 'none',
            background: 'var(--color-primary)', color: 'white', fontSize: '1rem',
            fontWeight: 500, cursor: 'pointer',
          }}
        >
          + Create Habit
        </button>
      </div>
    );
  }

  return (
    <div className="habit-list" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
      {habits.map(habit => (
        <HabitCard
          key={habit.id}
          habit={habit}
          todayLog={todayLogs[habit.id] || null}
          onLog={onLog}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
      {isCreating && (
        <HabitForm
          onSubmit={onCreate}
          onCancel={() => onCreate('cancel')}
        />
      )}
      {isEditing && (
        <HabitForm
          initialData={habitToUpdateInput(isEditing)}
          onSubmit={onCreate}
          onCancel={() => onCreate('cancel')}
          isEditing
        />
      )}
    </div>
  );
}