import { useState, useEffect, useCallback, useMemo } from 'react';
import { format, addDays, addWeeks, addMonths, startOfWeek } from 'date-fns';
import { DayView } from '../components/planner/views/DayView';
import { TripleView } from '../components/planner/views/TripleView';
import { WeekView } from '../components/planner/views/WeekView';
import { MonthView } from '../components/planner/views/MonthView';
import { EventForm } from '../components/planner/EventForm';
import { fetchEvents, createEvent, updateEvent, deleteEvent, startEvent } from '../api/planner';
import type { PlannerEvent, ViewRange, CreatePlannerEvent, UpdatePlannerEvent } from '../types/planner';

const VIEW_LABELS: Record<ViewRange, string> = {
  daily: 'Day', '3days': 'Day+', weekly: 'Week', monthly: 'Month',
};

let toastId = 0;

export default function PlannerPage() {
  const [viewRange, setViewRange] = useState<ViewRange>('daily');
  const [currentDate, setCurrentDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [events, setEvents] = useState<PlannerEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<PlannerEvent | null>(null);
  const [statusFilter, setStatusFilter] = useState<PlannerEvent['status'] | 'all'>('all');
  const [toast, setToast] = useState<{ id: number; msg: string; type: 'success' | 'error' } | null>(null);

  const showToast = (msg: string, type: 'success' | 'error') => {
    const id = ++toastId;
    setToast({ id, msg, type });
    setTimeout(() => setToast(prev => prev?.id === id ? null : prev), 3000);
  };

  const loadEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchEvents(currentDate, viewRange);
      setEvents(data);
    } catch (err) {
      console.error('Failed to load events:', err);
      setError('Failed to load events');
    } finally {
      setLoading(false);
    }
  }, [currentDate, viewRange]);

  useEffect(() => { loadEvents(); }, [loadEvents]);

  const navigate = (dir: 'prev' | 'next') => {
    const d = new Date(currentDate + 'T00:00:00');
    const mul = dir === 'next' ? 1 : -1;
    if (viewRange === 'daily') setCurrentDate(format(addDays(d, mul), 'yyyy-MM-dd'));
    else if (viewRange === 'weekly') setCurrentDate(format(addWeeks(d, mul), 'yyyy-MM-dd'));
    else if (viewRange === '3days') setCurrentDate(format(addDays(d, mul * 3), 'yyyy-MM-dd'));
    else setCurrentDate(format(addMonths(d, mul), 'yyyy-MM-dd'));
  };

  const goToday = () => setCurrentDate(format(new Date(), 'yyyy-MM-dd'));

  const handleDelete = async (id: string) => {
    try { await deleteEvent(id); setEvents(prev => prev.filter(e => e.id !== id)); showToast('Event deleted', 'success'); }
    catch { showToast('Failed to delete event', 'error'); }
  };

  const handleStart = async (id: string) => {
    try { await startEvent(id); loadEvents(); showToast('Timer started', 'success'); }
    catch { showToast('Failed to start timer', 'error'); }
  };

  const handleCreate = async (data: CreatePlannerEvent) => {
    try { const ev = await createEvent(data); setEvents(prev => [...prev, ev]); showToast('Event created', 'success'); }
    catch { showToast('Failed to create event', 'error'); }
  };

  const handleUpdate = async (id: string, data: UpdatePlannerEvent) => {
    try { const ev = await updateEvent(id, data); setEvents(prev => prev.map(e => e.id === ev.id ? ev : e)); showToast('Event updated', 'success'); }
    catch { showToast('Failed to update event', 'error'); }
  };

  const handleSave = (data: CreatePlannerEvent | UpdatePlannerEvent) => {
    if (editingEvent) {
      handleUpdate(editingEvent.id, data);
    } else {
      handleCreate(data as CreatePlannerEvent);
    }
    setShowForm(false);
    setEditingEvent(null);
  };

  const headerLabel = () => {
    const d = new Date(currentDate + 'T00:00:00');
    if (viewRange === 'daily') return format(d, 'EEEE, MMMM d, yyyy');
    if (viewRange === 'weekly') {
      const mon = startOfWeek(d, { weekStartsOn: 1 });
      return `${format(mon, 'MMM d')} – ${format(addDays(mon, 6), 'MMM d, yyyy')}`;
    }
    if (viewRange === '3days') return `${format(d, 'MMM d')} – ${format(addDays(d, 2), 'MMM d, yyyy')}`;
    return format(d, 'MMMM yyyy');
  };

  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: events.length };
    for (const e of events) {
      counts[e.status] = (counts[e.status] || 0) + 1;
    }
    return counts;
  }, [events]);

  const STATUS_OPTIONS: { key: PlannerEvent['status'] | 'all'; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'scheduled', label: 'Scheduled' },
    { key: 'in_progress', label: 'In Progress' },
    { key: 'completed', label: 'Completed' },
    { key: 'missed', label: 'Missed' },
    { key: 'cancelled', label: 'Cancelled' },
  ];

  const filteredEvents = useMemo(
    () => statusFilter === 'all' ? events : events.filter(e => e.status === statusFilter),
    [events, statusFilter],
  );

  const { planned, actual } = useMemo(() => {
    const p = events.filter(e => e.status === 'scheduled' || e.status === 'in_progress').length;
    const a = events.filter(e => e.status === 'completed').length;
    return { planned: p, actual: a };
  }, [events]);

  const hasEvents = events.length > 0;

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] clay-card px-5 py-3 rounded-2xl shadow-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200 ${
          toast.type === 'success' ? 'bg-clr-success-10 clr-success' : 'bg-clr-danger-10 clr-danger'
        }`}>
          <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>
            {toast.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span className="font-body text-sm font-medium">{toast.msg}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('prev')}
            className="clay-button w-10 h-10 flex items-center justify-center rounded-2xl bg-clr-surface-white dark:bg-clr-surface-container-high clr-text-secondary hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-clr-primary"
            aria-label="Previous"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_left</span>
          </button>
          <h1 className="font-body text-lg font-semibold clr-text-primary min-w-[180px] text-center">{headerLabel()}</h1>
          <button
            onClick={() => navigate('next')}
            className="clay-button w-10 h-10 flex items-center justify-center rounded-2xl bg-clr-surface-white dark:bg-clr-surface-container-high clr-text-secondary hover:scale-110 transition-transform focus-visible:outline-2 focus-visible:outline-clr-primary"
            aria-label="Next"
          >
            <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>chevron_right</span>
          </button>
          <button
            onClick={goToday}
            className="clay-chip px-4 py-2 rounded-2xl bg-clr-primary-20 clr-text-primary font-body text-sm font-semibold hover:scale-105 transition-transform focus-visible:outline-2 focus-visible:outline-clr-primary"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-3">
          {/* View switcher */}
          <div className="flex rounded-2xl overflow-hidden clay-card p-1 gap-1">
            {(Object.entries(VIEW_LABELS) as [ViewRange, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setViewRange(key)}
                className={`px-4 py-2 rounded-xl font-body text-sm font-semibold transition-all focus-visible:outline-2 focus-visible:outline-clr-primary ${
                  viewRange === key
                    ? 'bg-clr-primary clr-on-primary shadow-lg scale-[1.02]'
                    : 'clr-text-secondary hover:clr-text-primary hover:bg-clr-surface-variant'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="clay-button px-5 py-3 rounded-2xl bg-clr-primary clr-on-primary font-body text-sm font-semibold flex items-center gap-2 hover:scale-105 transition-transform shadow-lg focus-visible:outline-2 focus-visible:outline-white"
          >
            <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>add</span>
            Add Event
          </button>
        </div>
      </div>

      {/* Stats row: planned vs actual */}
      {hasEvents && (
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="font-body text-sm clr-text-secondary">Planned</span>
            <span className="font-body text-lg font-bold clr-primary">{planned}</span>
          </div>
          <div className="w-px h-6 bg-clr-surface-container-high" />
          <div className="flex items-center gap-2">
            <span className="font-body text-sm clr-text-secondary">Completed</span>
            <span className="font-body text-lg font-bold clr-success">{actual}</span>
          </div>
          {planned > 0 && (
            <>
              <div className="w-px h-6 bg-clr-surface-container-high" />
              <div className="flex items-center gap-2">
                <span className="font-body text-sm clr-text-secondary">Rate</span>
                <span className="font-body text-lg font-bold clr-text-primary">{Math.round((actual / planned) * 100)}%</span>
              </div>
            </>
          )}
        </div>
      )}

      {/* Status filter pills */}
      {hasEvents && (
        <div className="flex items-center gap-2 flex-wrap">
          {STATUS_OPTIONS.map(opt => (
            <button
              key={opt.key}
              onClick={() => setStatusFilter(opt.key)}
              className={`px-3 py-1.5 rounded-2xl font-body text-xs font-semibold transition-all ${
                statusFilter === opt.key
                  ? 'bg-clr-primary clr-on-primary shadow-md'
                  : 'clay-chip bg-clr-surface-container-high clr-text-secondary hover:clr-text-primary'
              }`}
            >
              {opt.label}
              <span className="ml-1.5 opacity-70">{statusCounts[opt.key] || 0}</span>
            </button>
          ))}
        </div>
      )}

      {/* Divider */}
      <div className="h-px w-full bg-clr-surface-container-high" />

      {/* Error state */}
      {error && (
        <div className="clay-card p-[20px] flex items-center gap-3">
          <span className="material-symbols-outlined clr-danger text-2xl">error</span>
          <p className="font-body text-[15px] clr-danger">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-16">
          <span className="material-symbols-outlined text-3xl clr-primary animate-spin">sync</span>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && !hasEvents && (
        <div className="clay-card p-[32px] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-clr-primary-10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl clr-primary" style={{ fontVariationSettings: "'FILL' 1" }}>calendar_month</span>
          </div>
          <h3 className="font-body text-[20px] font-semibold clr-text-primary">No events yet</h3>
          <p className="font-body text-[14px] clr-text-secondary mt-2 mb-5">
            Tap "Add Event" to schedule your first activity.
          </p>
          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="clay-button bg-clr-primary clr-on-primary rounded-full px-6 py-3 font-body text-sm font-semibold inline-flex items-center gap-2 hover:scale-105 transition-transform"
          >
            <span className="material-symbols-outlined text-lg">add_circle</span>
            Add Event
          </button>
        </div>
      )}

      {/* Calendar view */}
      {!loading && !error && hasEvents && (
        <div className="flex-1 min-h-0">
          {viewRange === 'daily' && (
            <DayView events={filteredEvents} date={currentDate} onEdit={(e) => { setEditingEvent(e); setShowForm(true); }} onDelete={handleDelete} onStart={handleStart} onEventsChange={loadEvents} />
          )}
          {viewRange === '3days' && (
            <TripleView events={filteredEvents} date={currentDate} onEdit={(e) => { setEditingEvent(e); setShowForm(true); }} onDelete={handleDelete} onStart={handleStart} />
          )}
          {viewRange === 'weekly' && (
            <WeekView events={filteredEvents} date={currentDate} onEdit={(e) => { setEditingEvent(e); setShowForm(true); }} onDelete={handleDelete} onStart={handleStart} />
          )}
          {viewRange === 'monthly' && (
            <MonthView events={filteredEvents} date={currentDate} onEdit={(e) => { setEditingEvent(e); setShowForm(true); }} onDelete={handleDelete} />
          )}
        </div>
      )}

      {/* Event form modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingEvent(null); }}>
          <div className="max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <EventForm event={editingEvent} onSave={handleSave} onClose={() => { setShowForm(false); setEditingEvent(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}
