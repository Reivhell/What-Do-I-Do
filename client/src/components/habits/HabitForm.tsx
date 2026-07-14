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

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export function HabitForm({ initialData, onSubmit, onCancel, isEditing = false }: HabitFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [targetFrequency, setTargetFrequency] = useState<HabitFrequency>(initialData?.targetFrequency || 'daily');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(initialData?.repeatRule || DEFAULT_REPEAT_RULE);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [linkedGoalId, setLinkedGoalId] = useState(initialData?.linkedGoalId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (targetFrequency === 'weekly' && (!repeatRule.daysOfWeek || repeatRule.daysOfWeek.length === 0)) {
      newErrors.daysOfWeek = 'Select at least one day';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    onSubmit({
      name: name.trim(),
      targetFrequency,
      repeatRule,
      notes: notes.trim() || undefined,
      linkedGoalId: linkedGoalId || undefined,
    });
  };

  const toggleDay = (day: number) => {
    const current = repeatRule.daysOfWeek || [];
    const updated = current.includes(day)
      ? current.filter((d) => d !== day)
      : [...current, day].sort();
    setRepeatRule({ ...repeatRule, daysOfWeek: updated });
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-[--radius-xl] bg-clay-surface clay-l2 p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-semibold clr-text-primary">
          {isEditing ? 'Edit Habit' : 'New Habit'}
        </h2>
        <button
          type="button"
          onClick={onCancel}
          className="tap-target rounded-[--radius-sm] clay-l1 bg-clay-surface hover:clay-pressed clay-transition clr-text-secondary"
          aria-label="Close"
        >
          <X className="size-5" />
        </button>
      </div>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="font-body text-[13px] font-semibold clr-text-secondary mb-1 block">Name</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Read 20 minutes"
            className={`w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] clr-text-primary placeholder:clr-text-300 clay-transition ${errors.name ? 'ring-2 ring-danger' : ''}`}
          />
          {errors.name && <span className="font-body text-[12px] text-danger mt-1 block">{errors.name}</span>}
        </div>

        {/* Frequency */}
        <div>
          <label className="font-body text-[13px] font-semibold clr-text-secondary mb-1 block">Frequency</label>
          <div className="flex gap-2">
            {FREQUENCIES.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => setTargetFrequency(f.value)}
                className={`flex-1 rounded-[--radius-md] px-3 py-2.5 font-body text-[13px] font-semibold clay-transition ${
                  targetFrequency === f.value
                    ? 'clay-pressed bg-clay-surface clr-text-primary'
                    : 'bg-clay-surface clay-l1 hover:clay-l2 clr-text-secondary'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Weekly day picker */}
        {targetFrequency === 'weekly' && (
          <div>
            <label className="font-body text-[13px] font-semibold clr-text-secondary mb-1 block">Days of week</label>
            <div className="flex gap-1.5 flex-wrap">
              {DAYS.map((day, idx) => {
                const dayNum = idx + 1; // mon=1, sun=7
                const selected = (repeatRule.daysOfWeek || []).includes(dayNum);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(dayNum)}
                    className={`rounded-full size-10 flex items-center justify-center font-body text-[13px] font-semibold clay-transition ${
                      selected
                        ? 'clay-pressed bg-clr-primary clr-on-primary'
                        : 'bg-clay-surface clay-l1 hover:clay-l2 clr-text-secondary hover:clr-text-primary'
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
            {errors.daysOfWeek && <span className="font-body text-[12px] text-danger mt-1 block">{errors.daysOfWeek}</span>}
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="font-body text-[13px] font-semibold clr-text-secondary mb-1 block">Notes (optional)</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Any additional notes..."
            className="w-full min-h-[60px] rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] clr-text-primary placeholder:clr-text-300 clay-transition"
          />
        </div>

        {/* Linked goal */}
        <div>
          <label className="font-body text-[13px] font-semibold clr-text-secondary mb-1 block">Linked Goal ID (optional)</label>
          <input
            value={linkedGoalId}
            onChange={(e) => setLinkedGoalId(e.target.value)}
            placeholder="Goal UUID"
            className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] clr-text-primary placeholder:clr-text-300 clay-transition"
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t brd-clr-divider-soft">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-[--radius-md] bg-clay-surface clay-l1 hover:clay-l2 px-5 py-2.5 font-body text-[13px] font-semibold clr-text-secondary hover:clr-text-primary clay-transition"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-[--radius-md] bg-clr-primary clr-on-primary px-5 py-2.5 font-body text-[13px] font-semibold clay-button hover:brightness-110 clay-transition"
        >
          {isEditing ? 'Save Changes' : 'Create Habit'}
        </button>
      </div>
    </form>
  );
}
