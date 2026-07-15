import { useState } from 'react';
import {
  Flame, Plus, Loader2, RefreshCw,
} from 'lucide-react';
import { useHabitsList, useCreateHabit, useUpdateHabit, useDeleteHabit, useLogHabit, useTodayLogs } from '../api/habits';
import { HabitList } from '../components/habits/HabitList';
import type { Habit, HabitLogStatus, CreateHabitInput, UpdateHabitInput } from '@whatdo/shared';

export function HabitsPage() {
  const { data: habits = [], isLoading, error, refetch } = useHabitsList();
  const createHabitMutation = useCreateHabit();
  const updateHabitMutation = useUpdateHabit();
  const deleteHabitMutation = useDeleteHabit();
  const logHabitMutation = useLogHabit();

  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  const habitIds = habits.map((h: Habit) => h.id);
  const { data: todayLogsData = [] } = useTodayLogs(habitIds);

  const todayLogs: Record<string, HabitLogStatus | null> = {};
  todayLogsData.forEach((log: { habitId: string; status: HabitLogStatus }) => {
    todayLogs[log.habitId] = log.status;
  });

  const handleCreate = async (data: CreateHabitInput | 'cancel' | null) => {
    if (data === 'cancel' || data === null) { setIsCreating(false); return; }
    try {
      await createHabitMutation.mutateAsync(data);
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create habit:', err);
    }
  };

  const handleUpdate = async (data: UpdateHabitInput | 'cancel' | null) => {
    if (data === 'cancel' || data === null || !editingHabit) { setEditingHabit(null); return; }
    try {
      await updateHabitMutation.mutateAsync({ id: editingHabit.id, data });
      setEditingHabit(null);
    } catch (err) {
      console.error('Failed to update habit:', err);
    }
  };

  const handleDelete = async (habitId: string) => {
    try {
      await deleteHabitMutation.mutateAsync(habitId);
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const handleLog = async (habitId: string, status: HabitLogStatus) => {
    const today = new Date().toISOString().split('T')[0];
    try {
      await logHabitMutation.mutateAsync({ id: habitId, data: { date: today, status } });
    } catch (err) {
      console.error('Failed to log habit:', err);
    }
  };

  if (error) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="font-display text-2xl font-bold text-ink-900">Habits</h1>
        <div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-6">
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-16 items-center justify-center rounded-[--radius-xl] bg-semantic-red/10">
              <span className="text-2xl">⚠</span>
            </div>
            <p className="font-body text-[15px] text-ink-500">Failed to load habits</p>
            <button onClick={() => refetch()} className="inline-flex items-center justify-center gap-2 rounded-[--radius-md] bg-blue-500 px-5 py-2.5 font-body text-sm font-semibold text-white clay-l1 hover:clay-l2 active:clay-pressed">
              <RefreshCw className="size-4" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold text-ink-900">Habits</h1>
            <p className="font-body text-[15px] text-ink-500 mt-1">
              Build consistency — daily, weekly, or monthly routines.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            disabled={createHabitMutation.isPending}
            className="inline-flex items-center gap-2 rounded-[--radius-pill] bg-blue-500 px-5 py-2.5 font-body text-sm font-semibold text-white clay-l1 hover:clay-l2 active:clay-pressed disabled:opacity-50"
          >
            {createHabitMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Plus className="size-4" />
            )}
            Habit Baru
          </button>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="size-8 animate-spin text-blue-400" />
        </div>
      ) : (
        <HabitList
          habits={habits}
          todayLogs={todayLogs}
          onLog={handleLog}
          onEdit={(h) => setEditingHabit(h)}
          onDelete={handleDelete}
          onCreate={handleCreate}
          isCreating={isCreating}
          isEditing={editingHabit}
        />
      )}

      {/* Edit form rendered outside list */}
      {editingHabit && (
        <div className="rounded-[--radius-lg] bg-clay-surface clay-l1 p-5">
          <h3 className="font-display text-lg font-semibold text-ink-900 mb-4">Edit Habit</h3>
          {/* Reuse HabitForm inline via setEditingHabit — the HabitList handles the form display */}
        </div>
      )}
    </div>
  );
}
