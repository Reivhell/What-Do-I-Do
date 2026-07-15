import { useState } from 'react';
import { MoreVertical, Trash2, PenSquare, ListChecks, Target, Flame } from 'lucide-react';
import { HabitLogButtons } from './HabitLogButtons';
import { HabitStreakDisplay } from './HabitStreakDisplay';
import type { Habit, HabitLogStatus } from '@whatdo/shared';

interface HabitCardProps {
  habit: Habit;
  todayLog?: HabitLogStatus | null;
  onLog: (habitId: string, status: HabitLogStatus) => void;
  onEdit: (habit: Habit) => void;
  onDelete: (habitId: string) => void;
}

export function HabitCard({ habit, todayLog, onLog, onEdit, onDelete }: HabitCardProps) {
  const [showMenu, setShowMenu] = useState(false);
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
    <div className={`rounded-[--radius-lg] bg-clay-surface clay-l1 p-5 transition-all duration-150 hover:clay-l2 ${isDoneToday ? 'opacity-60' : ''}`}>
      {/* Top row: title + menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-display text-lg font-semibold text-ink-900">{habit.name}</h3>
            {isDoneToday && <span className="text-lg shrink-0">✅</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="rounded-[--radius-sm] bg-clay-surface-alt clay-inset px-3 py-1 font-body text-[12px] text-ink-500">
              {getFrequencyLabel(habit.repeatRule?.freq ?? 'daily', habit.repeatRule)}
            </span>
            {habit.notes && (
              <span className="font-body text-[13px] text-ink-400 truncate">{habit.notes}</span>
            )}
          </div>
        </div>
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex size-8 items-center justify-center rounded-[--radius-sm] text-ink-400 hover:bg-clay-surface-alt hover:text-ink-700 clay-transition"
          >
            <MoreVertical className="size-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[140px] rounded-[--radius-md] bg-clay-surface clay-l2 p-1 shadow-lg">
              <button
                onClick={() => { onEdit(habit); setShowMenu(false); }}
                className="flex w-full items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-ink-700 hover:bg-blue-50 hover:text-blue-600 clay-transition"
              >
                <PenSquare className="size-3.5" />
                Edit
              </button>
              <button
                onClick={() => { onDelete(habit.id); setShowMenu(false); }}
                className="flex w-full items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-semantic-red hover:bg-semantic-red/10 clay-transition"
              >
                <Trash2 className="size-3.5" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Log buttons */}
      <div className="mt-4">
        <HabitLogButtons habitId={habit.id} todayLog={todayLog ?? undefined} onLog={(status) => onLog(habit.id, status)} />
      </div>

      {/* Streak display */}
      <div className="mt-3">
        <HabitStreakDisplay
          current={habit.currentStreak}
          best={habit.bestStreak}
          completionCount={habit.completionCount}
          missedCount={habit.missedCount}
        />
      </div>
    </div>
  );
}
