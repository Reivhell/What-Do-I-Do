import { useState } from 'react';
import { ClayInput } from '../ui/ClayInput';
import { Select } from '../ui/Select';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { PlannerEvent, CreatePlannerEvent, UpdatePlannerEvent, RepeatRule } from '../../types/planner';

const REMINDER_OPTIONS = [
  { value: '', label: 'No reminder' },
  { value: '15', label: '15 min before' },
  { value: '30', label: '30 min before' },
  { value: '60', label: '1 hour before' },
  { value: '1440', label: '1 day before' },
];

interface EventFormProps {
  event: PlannerEvent | null;
  onSave: (data: CreatePlannerEvent | UpdatePlannerEvent) => void;
  onClose: () => void;
}

export function EventForm({ event, onSave, onClose }: EventFormProps) {
  const [title, setTitle] = useState(event?.title || '');
  const [date, setDate] = useState(event?.date || new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(event?.startTime?.slice(11, 16) || '09:00');
  const [endTime, setEndTime] = useState(event?.endTime?.slice(11, 16) || '10:00');
  const [priority, setPriority] = useState(event?.priority || 'medium');
  const [category, setCategory] = useState(event?.category || '');
  const [notes, setNotes] = useState(event?.notes || '');
  const [hasRepeat, setHasRepeat] = useState(!!event?.repeatRule);
  const [repeatFreq, setRepeatFreq] = useState<'daily' | 'weekly' | 'monthly'>(
    (event?.repeatRule as RepeatRule)?.freq || 'weekly'
  );

  // ponytail: reminder stored as minutes-before offset string, parsed on submit
  const [reminderOffset, setReminderOffset] = useState(() => {
    if (!event?.reminderTime) return '';
    const diff = new Date(event.startTime).getTime() - new Date(event.reminderTime).getTime();
    const mins = Math.round(diff / 60000);
    const match = REMINDER_OPTIONS.find(o => parseInt(o.value) === mins);
    return match?.value || String(mins);
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const calcDuration = () => {
      const [sh, sm] = startTime.split(':').map(Number);
      const [eh, em] = endTime.split(':').map(Number);
      return (eh * 60 + em) - (sh * 60 + sm);
    };

    const base: CreatePlannerEvent = {
      title,
      date,
      startTime: `${date}T${startTime}:00.000Z`,
      endTime: `${date}T${endTime}:00.000Z`,
      durationMinutes: calcDuration(),
      priority,
      category: category || undefined,
      notes: notes || undefined,
    };

    if (reminderOffset) {
      const minutes = parseInt(reminderOffset, 10);
      const d = new Date(`${date}T${startTime}:00.000Z`);
      d.setMinutes(d.getMinutes() - minutes);
      base.reminderTime = d.toISOString();
    }

    if (hasRepeat) base.repeatRule = { freq: repeatFreq, interval: 1 };

    if (event) {
      onSave({ ...base, status: event.status });
    } else {
      onSave(base);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm" onClick={onClose}>
        {/* Modal card */}
        <Card level={2} className="p-6 rounded-2xl w-full max-w-lg mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="font-display text-xl font-semibold text-ink-900">
              {event ? 'Edit Event' : 'New Event'}
            </h2>
            <button onClick={onClose}
              className="clay-button w-10 h-10 flex items-center justify-center rounded-2xl bg-clay-surface text-ink-500 hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 0" }}>close</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <ClayInput label="Title" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="What are you doing?" />

            <div className="grid grid-cols-3 gap-3">
              <ClayInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
              <ClayInput label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
              <ClayInput label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <Select label="Priority" value={priority} onChange={(e) => setPriority(e.target.value)} options={[
                  { value: 'low', label: 'Low' },
                  { value: 'medium', label: 'Medium' },
                  { value: 'high', label: 'High' },
                ]} />
              </div>
              <div className="flex-1">
                <ClayInput label="Category" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="e.g. work" />
              </div>
            </div>

            <div>
              <label className="flex items-center gap-3 font-body text-sm font-semibold text-ink-900 cursor-pointer">
                <input type="checkbox" checked={hasRepeat} onChange={(e) => setHasRepeat(e.target.checked)}
                  className="w-4 h-4 rounded accent-[var(--color-blue-500)]" />
                Repeat
              </label>
              {hasRepeat && (
                <Select value={repeatFreq} onChange={(e) => setRepeatFreq(e.target.value as typeof repeatFreq)} className="mt-2" options={[
                  { value: 'daily', label: 'Daily' },
                  { value: 'weekly', label: 'Weekly' },
                  { value: 'monthly', label: 'Monthly' },
                ]} />
              )}
            </div>

            <div>
              <Select label="Reminder" value={reminderOffset} onChange={(e) => setReminderOffset(e.target.value)} options={REMINDER_OPTIONS} />
            </div>

            <div>
              <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500 block mb-2">Notes</label>
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
                className="clay-card-inset p-3 rounded-2xl w-full font-body text-sm text-ink-900 min-h-[70px] resize-none bg-clay-surface"
                placeholder="Optional notes..." />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" variant="primary">
                <span className="material-symbols-outlined text-base" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {event ? 'save' : 'add'}
                </span>
                {event ? 'Save Changes' : 'Create Event'}
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </>
  );
}
