import { useState } from 'react';
import { MoreVertical, Trash2, PenSquare } from 'lucide-react';
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
    <div className={`relative rounded-[--radius-lg] bg-clay-surface clay-l1 p-5 clay-transition hover:clay-l2 ${isDoneToday ? 'opacity-60' : ''}`}>
      {/* Top row: title + menu */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <h3 className="font-display text-lg font-semibold clr-text-primary">{habit.name}</h3>
            {isDoneToday && <span className="text-lg shrink-0">✅</span>}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="rounded-[--radius-sm] bg-clay-surface-alt clay-inset px-3 py-1 font-body text-[12px] clr-text-secondary">
              {getFrequencyLabel(habit.targetFrequency, habit.repeatRule)}
            </span>
            {habit.linkedGoalId && (
              <span className="rounded-[--radius-sm] bg-primary/10 clr-primary px-3 py-1 font-body text-[12px] font-medium">
                🎯 Linked to goal
              </span>
            )}
          </div>
        </div>

        {/* Menu */}
        <div className="relative shrink-0">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="tap-target rounded-[--radius-md] clay-l1 bg-clay-surface hover:clay-pressed clay-transition"
            aria-label="More options"
          >
            <MoreVertical className="size-5 clr-text-secondary" />
          </button>
          {showMenu && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowMenu(false)} />
              <div className="absolute right-0 top-full z-20 mt-1 w-40 rounded-[--radius-md] bg-clay-surface clay-l2 p-1">
                <button
                  onClick={() => { onEdit(habit); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-[--radius-sm] p-2 font-body text-[13px] clr-text-primary hover:bg-clay-surface-alt clay-transition"
                >
                  <PenSquare className="size-4" />
                  Edit
                </button>
                <button
                  onClick={() => { onDelete(habit.id); setShowMenu(false); }}
                  className="flex w-full items-center gap-2 rounded-[--radius-sm] p-2 font-body text-[13px] text-danger hover:bg-danger/10 clay-transition"
                >
                  <Trash2 className="size-4" />
                  Delete
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Streak + Stats row */}
      <div className="mt-4">
        <HabitStreakDisplay
          current={habit.currentStreak}
          best={habit.bestStreak}
          completionCount={habit.completionCount}
          missedCount={habit.missedCount}
        />
      </div>

      {/* Log buttons */}
      <div className="mt-4">
        <HabitLogButtons
          habitId={habit.id}
          todayLog={todayLog ?? undefined}
          onLog={(status) => onLog(habit.id, status)}
        />
      </div>

      {/* Notes */}
      {habit.notes && (
        <p className="mt-3 font-body text-[13px] clr-text-secondary italic border-t brd-clr-divider-soft pt-3">
          {habit.notes}
        </p>
      )}
    </div>
  );
}
