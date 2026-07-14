import type { PlannerEvent } from '../../types/planner';

interface EventCardProps {
  event: PlannerEvent;
  onEdit: (e: PlannerEvent) => void;
  onDelete: (id: string) => void;
  onStart?: (id: string) => void;
  compact?: boolean;
}

const STATUS_BG: Record<string, string> = {
  scheduled: 'bg-clr-primary',
  in_progress: 'bg-clr-success',
  completed: 'bg-clr-text-secondary',
  missed: 'bg-clr-danger',
  cancelled: 'bg-clr-text-muted',
};

const STATUS_TEXT: Record<string, string> = {
  scheduled: 'LIVE',
  in_progress: 'LIVE',
  completed: 'DONE',
  missed: 'MISSED',
  cancelled: 'CANCELLED',
};

export function EventCard({ event, onEdit, onDelete, onStart, compact }: EventCardProps) {
  const start = event.startTime.slice(11, 16);
  const end = event.endTime.slice(11, 16);

  return (
    <div
      data-event-id={event.id}
      data-event-date={event.date}
      data-event-start={event.startTime}
      className={`group relative rounded-2xl clay-card px-3 py-2 hover:scale-[1.02] transition-transform bg-clr-surface-white dark:bg-clr-surface-container ${compact ? 'text-xs' : ''}`}>
      {/* Left color accent line — inline style avoids dynamic Tailwind class */}
      <div
        className="absolute left-0 top-2 bottom-2 w-[3px] rounded-full"
        style={{
          backgroundColor:
            event.status === 'scheduled' ? 'var(--clr-primary)' :
            event.status === 'in_progress' ? 'var(--clr-success)' :
            event.status === 'completed' ? 'var(--clr-text-secondary)' :
            event.status === 'missed' ? 'var(--clr-danger)' :
            'var(--clr-text-muted)',
        }}
      />

      <div className="flex items-start justify-between gap-2 pl-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {event.category && (
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: event.category }} />
            )}
            <span className="font-body font-semibold clr-text-primary truncate text-sm">
              {event.title}
            </span>
            <span className={`w-1.5 h-1.5 rounded-full ${
              event.priority === 'high' ? 'bg-clr-danger' :
              event.priority === 'medium' ? 'bg-clr-secondary' : 'bg-clr-text-muted'
            }`} />
          </div>
          <div className="flex items-center gap-2 mt-1 clr-text-secondary font-body text-xs">
            <span className="material-symbols-outlined text-sm">schedule</span>
            <span>{start} – {end}</span>
            {event.sourceType !== 'manual' && (
              <span className="flex items-center gap-1 ml-1">
                <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                <span className="text-[10px] uppercase tracking-wider font-semibold">{event.sourceType}</span>
              </span>
            )}
          </div>
        </div>

        {/* Status badge — solid bg for contrast */}
        {(event.status === 'in_progress' || event.status === 'scheduled') && (
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white ${STATUS_BG[event.status] || 'bg-clr-primary'}`}>
            {STATUS_TEXT[event.status]}
          </span>
        )}

        {/* Action buttons — always visible with opacity, not hidden behind hover */}
        <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
          {onStart && (event.status === 'scheduled' || event.status === 'in_progress') && (
            <button
              onClick={(e) => { e.stopPropagation(); onStart(event.id); }}
              className="clay-button w-8 h-8 rounded-xl bg-clr-success-20 clr-success flex items-center justify-center hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-clr-primary"
              aria-label="Start timer"
            >
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(event); }}
            className="clay-button w-8 h-8 rounded-xl bg-clr-surface-white dark:bg-clr-surface-container-high clr-text-secondary flex items-center justify-center hover:clr-primary hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-clr-primary"
            aria-label="Edit event"
          >
            <span className="material-symbols-outlined text-lg">edit</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); if (window.confirm('Delete this event?')) onDelete(event.id); }}
            className="clay-button w-8 h-8 rounded-xl bg-clr-surface-white dark:bg-clr-surface-container-high clr-text-secondary flex items-center justify-center hover:clr-danger hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-clr-danger"
            aria-label="Delete event"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>
    </div>
  );
}
