import { Check, Minus, X } from 'lucide-react';
import type { HabitLogStatus } from '@whatdo/shared';

interface HabitLogButtonsProps {
  habitId: string;
  todayLog?: HabitLogStatus;
  onLog: (status: HabitLogStatus) => void;
  disabled?: boolean;
}

const STATUS_CONFIG: { value: HabitLogStatus; label: string; icon: React.ReactNode; activeClass: string }[] = [
  { value: 'done', label: 'Done', icon: <Check className="size-4" />, activeClass: 'bg-semantic-green/20 text-semantic-green border-semantic-green clay-pressed' },
  { value: 'skipped', label: 'Skip', icon: <Minus className="size-4" />, activeClass: 'bg-semantic-amber/20 text-semantic-amber border-semantic-amber clay-pressed' },
  { value: 'missed', label: 'Missed', icon: <X className="size-4" />, activeClass: 'bg-semantic-red/20 text-semantic-red border-semantic-red clay-pressed' },
];

export function HabitLogButtons({ habitId, todayLog, onLog, disabled }: HabitLogButtonsProps) {
  return (
    <div className="flex gap-2">
      {STATUS_CONFIG.map((s) => {
        const isSelected = todayLog === s.value;
        return (
          <button
            key={s.value}
            onClick={() => onLog(s.value)}
            disabled={disabled || isSelected}
            className={`flex-1 flex flex-col items-center gap-1 rounded-[--radius-md] px-3 py-2.5 font-body text-[13px] font-medium transition-all duration-150 ${
              isSelected
                ? s.activeClass
                : 'bg-clay-surface clay-l1 hover:clay-l2 active:clay-pressed text-ink-500 hover:text-ink-900'
            } disabled:cursor-not-allowed disabled:opacity-60`}
            title={isSelected ? `Already ${s.value}` : `Mark as ${s.value}`}
          >
            {s.icon}
            <span>{s.label}</span>
          </button>
        );
      })}
    </div>
  );
}
