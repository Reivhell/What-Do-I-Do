import { useState } from 'react';
import { useHabits, useCreateHabit, useUpdateHabit, useDeleteHabit, useLogHabit, useTodayLogs } from '../hooks/useHabits';
import { HabitList } from '../components/habits/HabitList';
import { Habit, HabitLogStatus, CreateHabitInput, UpdateHabitInput } from '../types/habits';

export function HabitsPage() {
  const { data: habits = [], isLoading, error, refetch } = useHabits();
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
      setEditingHabit(null);
      return;
    }
    try {
      await createHabitMutation.mutateAsync(data);
      setIsCreating(false);
      setEditingHabit(null);
      refetch();
    } catch (err) {
      console.error('Failed to create habit:', err);
    }
  };

  const handleUpdate = async (data: UpdateHabitInput | 'cancel') => {
    if (data === 'cancel' || !editingHabit) {
      setEditingHabit(null);
      return;
    }
    try {
      await updateHabitMutation.mutateAsync({ id: editingHabit.id, data });
      setEditingHabit(null);
      refetch();
    } catch (err) {
      console.error('Failed to update habit:', err);
    }
  };

  const handleDelete = async (habitId: string) => {
    if (!confirm('Are you sure you want to delete this habit? All logs will be lost.')) return;
    try {
      await deleteHabitMutation.mutateAsync(habitId);
      refetch();
    } catch (err) {
      console.error('Failed to delete habit:', err);
    }
  };

  const handleLog = (habitId: string, status: HabitLogStatus) => {
    logHabitMutation.mutate({ id: habitId, data: { date: new Date().toISOString().split('T')[0], status } });
    refetch();
  };

  const handleEdit = (habit: Habit) => {
    setEditingHabit(habit);
    setIsCreating(false);
  };

  const handleNewHabit = () => {
    setIsCreating(true);
    setEditingHabit(null);
  };

  if (isLoading) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <div className="text-center p-12 clr-text-secondary">Loading habits...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-[700px] mx-auto">
        <div className="text-center p-12 clr-danger">
          <p>Failed to load habits</p>
          <button onClick={() => refetch()} className="mt-4 px-5 py-2.5 rounded-lg bg-clr-primary clr-on-primary cursor-pointer border-none clay-button">
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-bold clr-text-primary">Habits</h1>
        <button
          onClick={handleNewHabit}
          disabled={createHabitMutation.isPending}
          className="rounded-lg bg-clr-primary clr-on-primary px-4 py-2.5 font-body text-sm font-medium clay-button disabled:opacity-70 disabled:cursor-not-allowed"
        >
          + New Habit
        </button>
      </div>

      <HabitList
        habits={habits}
        todayLogs={todayLogs}
        onLog={handleLog}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onCreate={editingHabit ? handleUpdate : handleCreate}
        isCreating={isCreating && !editingHabit}
        isEditing={editingHabit}
      />
    </div>
  );
}
