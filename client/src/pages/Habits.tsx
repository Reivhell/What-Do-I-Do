import { useState } from 'react';
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
    if (data === 'cancel' || data === null) {
      setIsCreating(false);
      return;
    }
    try {
      await createHabitMutation.mutateAsync(data);
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create habit:', err);
    }
  };

  const handleUpdate = async (data: UpdateHabitInput | 'cancel' | null) => {
    if (data === 'cancel' || data === null || !editingHabit) {
      setEditingHabit(null);
      return;
    }
    try {
      await updateHabitMutation.mutateAsync({ id: editingHabit.id, data });
      setEditingHabit(null);
    } catch (err) {
      console.error('Failed to update habit:', err);
    }
  };

  const handleDelete = async (habitId: string) => {
    if (confirm('Delete this habit?')) {
      try {
        await deleteHabitMutation.mutateAsync(habitId);
      } catch (err) {
        console.error('Failed to delete habit:', err);
      }
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
        <h1 className="font-display text-2xl font-bold clr-text-primary">Habits</h1>
        <div className="clay-card p-6">
          <div className="flex flex-col items-center gap-4 py-16 text-center">
            <div className="flex size-20 items-center justify-center rounded-[--radius-xl] bg-danger/10">
              <span className="text-2xl text-danger">⚠</span>
            </div>
            <p className="font-body text-[15px] clr-text-secondary">Failed to load habits</p>
            <button onClick={() => refetch()} className="clay-button rounded-[--radius-md] bg-clr-primary clr-on-primary px-6 py-2.5 font-body text-sm font-semibold">
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
            <h1 className="font-display text-2xl font-bold clr-text-primary flex items-center gap-3">
              <span className="clr-primary">🔥</span>
              Habits
            </h1>
            <p className="font-body text-[15px] clr-text-secondary mt-1">
              Build consistency — daily, weekly, or monthly routines.
            </p>
          </div>
          <button
            onClick={() => setIsCreating(true)}
            disabled={createHabitMutation.isPending}
            className="rounded-full bg-clr-primary clr-on-primary px-6 py-3 font-body text-sm font-semibold clay-button disabled:opacity-70 disabled:cursor-not-allowed"
          >
            + New Habit
          </button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="clay-card p-6">
          <div className="flex items-center justify-center py-16 text-ink-300">
            <div className="animate-spin rounded-full border-3 border-primary border-t-transparent size-8" />
          </div>
        </div>
      )}

      {/* Content */}
      {!isLoading && (
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

      {/* Edit modal via HabitForm in HabitList */}
    </div>
  );
}
