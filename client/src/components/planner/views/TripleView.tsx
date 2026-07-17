import { addDays, format } from 'date-fns';
import { EventCard } from '../EventCard';
import type { PlannerEvent } from '../../../types/planner';

interface TripleViewProps {
  events: PlannerEvent[];
  date: string;
  onEdit: (e: PlannerEvent) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
}

const HOURS = Array.from({ length: 14 }, (_, i) => i + 7); // align with WeekView
const today = format(new Date(), 'yyyy-MM-dd');

export function TripleView({ events, date, onEdit, onDelete, onStart }: TripleViewProps) {
  const baseDate = new Date(date + 'T00:00:00');
  const days = [0, 1, 2].map(d => addDays(baseDate, d));

  const getEventsForDayHour = (dayStr: string, hour: number) =>
    events.filter(e => e.date === dayStr && parseInt(e.startTime.slice(11, 13), 10) === hour);

  return (
    <div className="overflow-auto h-full rounded-2xl clay-card-inset p-3 bg-clay-surface">
      <div className="min-w-[500px] lg:min-w-0">
        <div className="grid grid-cols-[50px_repeat(3,1fr)]">
          <div className="border-b border-clay-surface" />
          {days.map((d, i) => {
            const dayStr = format(d, 'yyyy-MM-dd');
            return (
              <div key={i} className={`border-b border-l border-clay-surface p-3 text-center ${dayStr === today ? 'bg-[var(--color-blue-500)]/10' : ''}`}>
                <div className="font-body text-xs font-semibold text-ink-500">{format(d, 'EEE')}</div>
                <div className="font-body text-base font-bold text-ink-900">{format(d, 'd')}</div>
                <div className="font-body text-[10px] text-ink-300">{format(d, 'MMM')}</div>
              </div>
            );
          })}
          {HOURS.map((hour) => (
            <div key={hour} className="contents">
              <div className="border-t border-clay-surface px-1 py-2 text-right font-body text-[11px] text-ink-500">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {days.map((d, j) => {
                const dayStr = format(d, 'yyyy-MM-dd');
                const cellEvents = getEventsForDayHour(dayStr, hour);
                return (
                  <div key={j} className="border-t border-l border-clay-surface p-1 min-h-[32px]">
                    {cellEvents.map(ev => (
                      <EventCard key={ev.id} event={ev} onEdit={onEdit} onDelete={onDelete} onStart={onStart} compact />
                    ))}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
