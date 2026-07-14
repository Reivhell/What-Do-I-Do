import { HabitCard } from './HabitCard';
import { HabitForm } from './HabitForm';
import type { Habit, HabitLogStatus, CreateHabitInput, UpdateHabitInput } from '@whatdo/shared';

interface HabitListProps {
  habits: Habit[];
  todayLogs: Record<string, HabitLogStatus | null>;
  onLog: (habitId: string, status: HabitLogStatus) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
  onCreate: (data: CreateHabitInput | 'cancel' | null) => void;
  isCreating?: boolean;
  isEditing?: Habit | null;
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
  // Empty state
  if (habits.length === 0 && !isCreating) {
    return (
      <div className="clay-card p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-[--radius-xl] bg-blue-50 clay-inset">
            <span className="text-3xl">🌱</span>
          </div>
          <div className="max-w-[280px]">
            <p className="font-display text-lg font-semibold clr-text-primary">No habits yet</p>
            <p className="mt-1 font-body text-[15px] clr-text-secondary">
              Start building consistency by creating your first habit
            </p>
          </div>
          <button
            onClick={() => onCreate(null)}
            className="clay-button rounded-[--radius-md] bg-clr-primary clr-on-primary px-6 py-2.5 font-body text-sm font-semibold mt-2"
          >
            + Create Habit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Create form */}
      {isCreating && (
        <HabitForm
          onSubmit={(data) => onCreate(data as CreateHabitInput)}
          onCancel={() => onCreate('cancel')}
        />
      )}

      {/* Header count */}
      {habits.length > 0 && (
        <p className="font-body text-[13px] clr-text-secondary px-1">
          {habits.length} {habits.length === 1 ? 'habit' : 'habits'}
        </p>
      )}

      {/* Habit cards */}
      {habits.map((habit) => (
        <div key={habit.id}>
          {isEditing && isEditing.id === habit.id ? (
            <HabitForm
              initialData={{
                name: habit.name,
                targetFrequency: habit.targetFrequency,
                repeatRule: habit.repeatRule,
                notes: habit.notes ?? undefined,
                linkedGoalId: habit.linkedGoalId ?? undefined,
              }}
              onSubmit={(data) => {
                onEdit(habit);
                // The parent will use the data
                onEdit(habit);
              }}
              onCancel={() => onEdit(habit)}
              isEditing
            />
          ) : (
            <HabitCard
              habit={habit}
              todayLog={todayLogs[habit.id] ?? null}
              onLog={onLog}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          )}
        </div>
      ))}
    </div>
  );
}
