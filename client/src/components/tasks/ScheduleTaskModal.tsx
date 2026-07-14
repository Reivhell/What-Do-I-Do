import { useState, type FormEvent } from 'react';
import { X, Calendar, Clock, Loader2 } from 'lucide-react';
import { Card, Button, Input } from '../ui';
import { Modal } from '../ui/Modal';
import { useScheduleTask } from '../../api/tasks';
import type { Task } from '../../types/tasks';

interface ScheduleTaskModalProps {
  task: Pick<Task, 'id' | 'title'>;
  open: boolean;
  onClose: () => void;
}

export function ScheduleTaskModal({ task, open, onClose }: ScheduleTaskModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [error, setError] = useState<string | null>(null);

  const scheduleTask = useScheduleTask();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!task.id) return;

    if (startTime >= endTime) {
      setError('End time must be after start time');
      return;
    }

    scheduleTask.mutate({
      id: task.id,
      data: { date, startTime, endTime, durationMinutes: duration },
    }, {
      onSuccess: () => {
        setDate(new Date().toISOString().split('T')[0]);
        setStartTime('09:00');
        setEndTime('10:00');
        setDuration(60);
        onClose();
      },
      onError: (err: Error) => setError(err.message),
    });
  };

  const updateDuration = () => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    const diff = (eh * 60 + em) - (sh * 60 + sm);
    if (diff > 0) setDuration(diff);
  };

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Schedule: ${task.title}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="p-3 rounded-[--radius-md] bg-danger/10 text-danger text-[13px] font-body">
            {error}
          </div>
        )}

        <div>
          <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
            className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
              Start Time
            </label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => { setStartTime(e.target.value); updateDuration(); }}
              className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <div>
            <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
              End Time
            </label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => { setEndTime(e.target.value); updateDuration(); }}
              className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        <div>
          <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
            Duration
          </label>
          <div className="flex items-center gap-3">
            <input
              type="number"
              value={duration}
              onChange={(e) => setDuration(Math.max(1, Math.min(1440, Number(e.target.value))))}
              min={1}
              max={1440}
              className="w-24 rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
            <span className="font-body text-[15px] text-ink-500">minutes</span>
          </div>
        </div>

        <div className="pt-4 border-t brd-clr-divider-soft flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={scheduleTask.isPending}>
            {scheduleTask.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              'Schedule'
            )}
          </Button>
        </div>
      </form>
    </Modal>
  );
}