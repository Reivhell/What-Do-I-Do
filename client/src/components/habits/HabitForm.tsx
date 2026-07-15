import { useState } from 'react';
import { X } from 'lucide-react';
import type { CreateHabitInput, UpdateHabitInput, RepeatRule, HabitFrequency } from '@whatdo/shared';

interface HabitFormProps {
  initialData?: CreateHabitInput | UpdateHabitInput;
  onSubmit: (data: CreateHabitInput | UpdateHabitInput) => void;
  onCancel: () => void;
  isEditing?: boolean;
}

const DEFAULT_REPEAT_RULE: RepeatRule = {
  freq: 'daily',
  interval: 1,
  daysOfWeek: undefined,
  endCondition: undefined,
};

const FREQUENCIES: { value: HabitFrequency; label: string }[] = [
  { value: 'daily', label: 'Daily' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'custom', label: 'Custom' },
];

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function HabitForm({ initialData, onSubmit, onCancel, isEditing }: HabitFormProps) {
  const [name, setName] = useState((initialData as any)?.name ?? '');
  const [description, setDescription] = useState((initialData as any)?.description ?? '');
  const [frequency, setFrequency] = useState<HabitFrequency>((initialData as any)?.repeatRule?.freq ?? 'daily');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>((initialData as any)?.repeatRule?.daysOfWeek ?? []);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (frequency === 'weekly' && daysOfWeek.length === 0) newErrors.daysOfWeek = 'Select at least one day';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    const data: CreateHabitInput | UpdateHabitInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      repeatRule: { freq: frequency, interval: 1, daysOfWeek: frequency === 'weekly' ? daysOfWeek : undefined },
    } as any;
    onSubmit(data);
  };

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      {/* Name */}
      <div>
        <label className="mb-1.5 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Morning run"
          className={`w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-400 transition-shadow ${errors.name ? 'ring-2 ring-semantic-red' : ''}`}
        />
        {errors.name && <span className="font-body text-[12px] text-semantic-red mt-1 block">{errors.name}</span>}
      </div>

      {/* Description */}
      <div>
        <label className="mb-1.5 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Description</label>
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Optional description"
          className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-400"
        />
      </div>

      {/* Frequency */}
      <div>
        <label className="mb-1.5 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Frequency</label>
        <div className="flex gap-2">
          {FREQUENCIES.map((f) => (
            <button
              key={f.value}
              type="button"
              onClick={() => setFrequency(f.value)}
              className={`rounded-[--radius-pill] px-4 py-2 font-body text-[13px] font-medium transition-all ${
                frequency === f.value
                  ? 'bg-blue-500 text-white clay-l1'
                  : 'bg-clay-surface text-ink-500 clay-l1 hover:clay-l2'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Days of week (weekly only) */}
      {frequency === 'weekly' && (
        <div>
          <label className="mb-1.5 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Repeat on</label>
          <div className="flex gap-2">
            {DAYS.map((day, idx) => (
              <button
                key={day}
                type="button"
                onClick={() => toggleDay(idx)}
                className={`size-10 rounded-full font-body text-[13px] font-medium transition-all ${
                  daysOfWeek.includes(idx)
                    ? 'bg-blue-500 text-white clay-l1'
                    : 'bg-clay-surface text-ink-500 clay-l1 hover:clay-l2'
                }`}
              >
                {day[0]}
              </button>
            ))}
          </div>
          {errors.daysOfWeek && <span className="font-body text-[12px] text-semantic-red mt-1 block">{errors.daysOfWeek}</span>}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4 border-t border-ink-200/20">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center justify-center rounded-[--radius-md] bg-clay-surface px-5 py-2.5 font-body text-[13px] font-semibold text-ink-900 clay-l1 hover:clay-l2 active:clay-pressed"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="inline-flex items-center justify-center rounded-[--radius-md] bg-blue-500 px-5 py-2.5 font-body text-[13px] font-semibold text-white clay-l1 hover:clay-l2 active:clay-pressed"
        >
          {isEditing ? 'Save' : 'Create'}
        </button>
      </div>
    </form>
  );
}
