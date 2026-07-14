import { useState, useCallback, useMemo } from 'react';
import { DndContext, type DragEndEvent, useDroppable, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { parseISO, isSameDay, isToday as isTodayFn } from 'date-fns';
import type { PlannerEvent } from '../../../types/planner';
import { EventCard } from '../EventCard';
import { updateEvent } from '../../../api/planner';

interface DayViewProps {
  events: PlannerEvent[];
  date: string;
  onEdit: (event: PlannerEvent) => void;
  onDelete: (id: string) => void;
  onStart: (id: string) => void;
  onEventsChange: () => void;
}

const HOURS = Array.from({ length: 24 }, (_, i) => i);

function HourSlot({ hour, children, isNow, isPast }: { hour: number; children: React.ReactNode; isNow: boolean; isPast: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: String(hour) });
  return (
    <div
      ref={setNodeRef}
      className={`flex items-start gap-3 p-3 rounded-2xl transition-colors ${
        isNow ? 'bg-clr-primary-20 ring-1 ring-clr-primary/20' :
        isOver ? 'bg-clr-primary-10 ring-2 ring-clr-primary/30' :
        isPast ? '' : 'hover:bg-clr-surface-container-high'
      }`}
    >
      {children}
    </div>
  );
}

export function DayView({ events, date, onEdit, onDelete, onStart, onEventsChange }: DayViewProps) {
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  const dayEvents = useMemo(
    () => events.filter((e) => {
      const d = parseISO(e.date);
      return isSameDay(d, parseISO(date));
    }),
    [events, date],
  );

  const isToday = isTodayFn(parseISO(date));
  const nowHour = new Date().getHours();

  const getEventsForHour = (hour: number) =>
    dayEvents.filter((e) => {
      const h = parseInt(e.startTime.slice(0, 2), 10);
      return h === hour;
    });

  const handleDragEnd = useCallback(async (dragEvent: DragEndEvent) => {
    setActiveId(null);
    const { active, over } = dragEvent;
    if (!over || active.id === over.id) return;

    const eventId = active.id as string;
    const targetHour = parseInt(over.id as string, 10);
    if (isNaN(targetHour)) return;

    const ev = dayEvents.find(e => e.id === eventId);
    if (!ev) return;

    const newStart = `${ev.startTime.slice(0, 11)}${targetHour.toString().padStart(2, '0')}:00`;
    const dur = ev.durationMinutes || 60;
    const endH = Math.min(23, targetHour + Math.ceil(dur / 60));
    const newEnd = `${ev.startTime.slice(0, 11)}${endH.toString().padStart(2, '0')}:${(dur % 60).toString().padStart(2, '0')}`;

    try {
      await updateEvent(eventId, { startTime: newStart, endTime: newEnd });
      onEventsChange();
    } catch {}
  }, [dayEvents, onEventsChange]);

  return (
    <DndContext
      sensors={sensors}
      onDragStart={(e) => setActiveId(e.active.id as string)}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-1 overflow-auto max-h-[70vh]">
        {HOURS.map((hour) => {
          const hourEvents = getEventsForHour(hour);
          const isNow = isToday && hour === nowHour;
          const isPast = isToday && hour < nowHour;
          return (
            <HourSlot key={hour} hour={hour} isNow={isNow} isPast={isPast}>
              <div className="flex items-start gap-2 w-16 shrink-0 pt-1 relative">
                {isNow && (
                  <div className="absolute -left-2 top-1.5 w-2 h-2 rounded-full bg-clr-danger" style={{ zIndex: 1 }} />
                )}
                <span className={`font-body text-xs font-medium ${isNow ? 'clr-danger font-bold' : 'clr-text-secondary'} w-12 text-right`}>
                  {hour.toString().padStart(2, '0')}:00
                </span>
              </div>

              <div className="flex-1 min-w-0">
                {isNow && (
                  <div className="flex items-center gap-1 mb-1">
                    <span className="text-[10px] font-bold clr-danger uppercase tracking-wider">Now</span>
                    <div className="h-px flex-1 bg-clr-danger/40" />
                  </div>
                )}
                {hourEvents.length > 0 ? (
                  <div className="space-y-1">
                    {hourEvents.map(ev => (
                      <EventCard
                        key={ev.id}
                        event={ev}
                        onEdit={onEdit}
                        onDelete={onDelete}
                        onStart={onStart}
                      />
                    ))}
                  </div>
                ) : !isNow ? (
                  <span className="font-body text-[11px] clr-text-muted">No events</span>
                ) : null}
              </div>
            </HourSlot>
          );
        })}
      </div>
    </DndContext>
  );
}
