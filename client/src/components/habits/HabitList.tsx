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
  if (habits.length === 0 && !isCreating) {
    return (
      <div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-6">
        <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
          <div className="flex size-20 items-center justify-center rounded-[--radius-xl] bg-blue-50 clay-inset">
            <span className="text-3xl">🌱</span>
          </div>
          <div className="max-w-[280px]">
            <p className="font-display text-lg font-semibold text-ink-900">No habits yet</p>
            <p className="mt-1 font-body text-[15px] text-ink-500">
              Start building consistency by creating your first habit
            </p>
          </div>
          <button
            onClick={() => onCreate(null)}
            className="inline-flex items-center justify-center rounded-[--radius-md] bg-blue-500 px-6 py-2.5 font-body text-sm font-semibold text-white clay-l1 hover:clay-l2 active:clay-pressed"
          >
            + Create Habit
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isCreating && (
        <div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">New Habit</h3>
          <HabitForm onSubmit={(data) => onCreate(data as CreateHabitInput)} onCancel={() => onCreate('cancel')} />
        </div>
      )}

      {habits.length === 0 ? null : (
        <div className="flex flex-col gap-3">
          {habits.map((habit) => (
            <HabitCard
              key={habit.id}
              habit={habit}
              todayLog={todayLogs[habit.id] ?? null}
              onLog={onLog}
              onEdit={onEdit}
              onDelete={onDelete}
            />
          ))}
        </div>
      )}

      {isEditing && (
        <div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">Edit Habit</h3>
          <HabitForm
            initialData={isEditing}
            onSubmit={(data) => { onEdit(data as unknown as Habit); }}
            onCancel={() => onEdit(null as unknown as Habit)}
            isEditing
          />
        </div>
      )}
    </div>
  );
}
