import { startOfMonth, endOfMonth, startOfWeek, endOfWeek, addDays, format, isSameMonth } from 'date-fns';
import type { PlannerEvent } from '../../../types/planner';

interface MonthViewProps {
  events: PlannerEvent[];
  date: string;
  onEdit: (e: PlannerEvent) => void;
  onDelete: (id: string) => void;
}

const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const today = format(new Date(), 'yyyy-MM-dd');

export function MonthView({ events, date, onEdit, onDelete }: MonthViewProps) {
  const start = startOfWeek(startOfMonth(new Date(date + 'T00:00:00')), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(new Date(date + 'T00:00:00')), { weekStartsOn: 1 });
  const days: Date[] = [];
  let cursor = start;
  while (cursor <= end) { days.push(cursor); cursor = addDays(cursor, 1); }

  const getEventsForDay = (dayStr: string) => events.filter(e => e.date === dayStr);

  return (
    <div className="rounded-2xl clay-card-inset p-4 bg-clr-surface-white dark:bg-clr-surface-container-high overflow-hidden">
      {/* Day headers */}
      <div className="grid grid-cols-7">
        {DAY_NAMES.map(name => (
          <div key={name} className="border-b border-clr-surface-container-high px-3 py-3 text-center font-body text-[11px] font-semibold uppercase clr-text-secondary">
            {name}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 auto-rows-fr">
        {days.map((d, i) => {
          const dayStr = format(d, 'yyyy-MM-dd');
          const dayEvents = getEventsForDay(dayStr);
          const isCurrentMonth = isSameMonth(d, new Date(date + 'T00:00:00'));
          const isToday = dayStr === today;

          return (
            <div
              key={i}
              className={`min-h-[90px] border-b border-clr-surface-container-high p-1.5 ${
                i % 7 !== 0 ? 'border-l' : ''
              } ${!isCurrentMonth ? 'bg-clr-surface-container-high/50' : 'hover:bg-clr-surface-container-high/30 transition-colors'}`}
            >
              <span className={`font-body text-xs font-semibold ${
                isToday ? 'bg-clr-primary clr-on-primary w-6 h-6 rounded-full flex items-center justify-center' :
                isCurrentMonth ? 'clr-text-primary' : 'clr-text-muted'
              }`}>
                {format(d, 'd')}
              </span>
              <div className="mt-1 space-y-0.5">
                {dayEvents.slice(0, 3).map(ev => (
                  <button
                    key={ev.id}
                    onClick={() => onEdit(ev)}
                    className="block w-full text-left truncate text-[11px] font-body font-medium clr-text-primary hover:bg-clr-primary-10 rounded-md px-1 py-0.5 transition-colors focus-visible:outline-2 focus-visible:outline-clr-primary"
                    aria-label={ev.title}
                  >
                    <span className={`inline-block w-1.5 h-1.5 rounded-full mr-1 ${
                      ev.status === 'completed' ? 'bg-clr-success' :
                      ev.status === 'in_progress' ? 'bg-clr-success animate-pulse' :
                      ev.status === 'missed' ? 'bg-clr-danger' :
                      'bg-clr-primary'
                    }`} />
                    {ev.title}
                  </button>
                ))}
                {dayEvents.length > 3 && (
                  <span className="font-body text-[10px] clr-text-muted font-medium">+{dayEvents.length - 3} more</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
