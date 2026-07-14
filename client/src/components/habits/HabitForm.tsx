import { useState, useEffect } from 'react';
import { CreateHabitInput, UpdateHabitInput, RepeatRule, HabitFrequency } from '../../types/habits';

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

export function HabitForm({ initialData, onSubmit, onCancel, isEditing = false }: HabitFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [targetFrequency, setTargetFrequency] = useState<HabitFrequency>(initialData?.targetFrequency || 'daily');
  const [repeatRule, setRepeatRule] = useState<RepeatRule>(initialData?.repeatRule || DEFAULT_REPEAT_RULE);
  const [notes, setNotes] = useState(initialData?.notes || '');
  const [linkedGoalId, setLinkedGoalId] = useState(initialData?.linkedGoalId || '');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!name.trim()) newErrors.name = 'Name is required';
    if (repeatRule.freq === 'weekly' && (!repeatRule.daysOfWeek || repeatRule.daysOfWeek.length === 0)) {
      newErrors.daysOfWeek = 'Select at least one day for weekly habit';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const data: CreateHabitInput | UpdateHabitInput = {
      name: name.trim(),
      targetFrequency,
      repeatRule,
      notes: notes.trim() || undefined,
      linkedGoalId: linkedGoalId || undefined,
    };
    onSubmit(data);
  };

  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="habit-form-modal" style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '16px',
    }} onClick={onCancel}>
      <div style={{
        background: 'var(--color-surface)',
        borderRadius: '16px',
        padding: '24px',
        width: '100%',
        maxWidth: '480px',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
      }} onClick={e => e.stopPropagation()}>
        <h2 style={{ margin: '0 0 20px', fontSize: '1.5rem' }}>
          {isEditing ? 'Edit Habit' : 'New Habit'}
        </h2>

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.875rem' }}>
              Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g., Drink water, Exercise, Read 20 min"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${errors.name ? 'var(--color-error)' : 'var(--color-border)'}`,
                background: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
            {errors.name && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.name}</span>}
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.875rem' }}>
              Frequency
            </label>
            <select
              value={targetFrequency}
              onChange={e => setTargetFrequency(e.target.value as HabitFrequency)}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: '1rem',
              }}
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="custom">Custom</option>
            </select>
          </div>

          <fieldset style={{ border: '1px solid var(--color-border)', borderRadius: '8px', padding: '16px', marginBottom: '16px' }}>
            <legend style={{ fontWeight: 500, fontSize: '0.875rem', padding: '0 8px' }}>
              Repeat Schedule
            </legend>
            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                Repeat every
              </label>
              <div style={{ display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  type="number"
                  min="1"
                  max="99"
                  value={repeatRule.interval}
                  onChange={e => setRepeatRule({ ...repeatRule, interval: parseInt(e.target.value) || 1 })}
                  style={{
                    width: '80px',
                    padding: '10px',
                    borderRadius: '8px',
                    border: '1px solid var(--color-border)',
                    background: 'var(--color-background)',
                    color: 'var(--color-text)',
                  }}
                />
                <span>{repeatRule.freq === 'daily' ? 'day(s)' : repeatRule.freq === 'weekly' ? 'week(s)' : 'month(s)'}</span>
              </div>
            </div>

            {repeatRule.freq === 'weekly' && (
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontSize: '0.875rem' }}>
                  Days of week
                </label>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  {days.map((day, i) => (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newDays = repeatRule.daysOfWeek?.includes(i)
                          ? repeatRule.daysOfWeek.filter(d => d !== i)
                          : [...(repeatRule.daysOfWeek || []), i];
                        setRepeatRule({ ...repeatRule, daysOfWeek: newDays });
                      }}
                      style={{
                        padding: '8px 12px',
                        borderRadius: '8px',
                        border: `2px solid ${repeatRule.daysOfWeek?.includes(i) ? 'var(--color-primary)' : 'var(--color-border)'}`,
                        background: repeatRule.daysOfWeek?.includes(i) ? 'var(--color-primary)15' : 'var(--color-background)',
                        color: repeatRule.daysOfWeek?.includes(i) ? 'var(--color-primary)' : 'var(--color-text)',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: repeatRule.daysOfWeek?.includes(i) ? 600 : 400,
                      }}
                    >
                      {day}
                    </button>
                  ))}
                </div>
                {errors.daysOfWeek && <span style={{ color: 'var(--color-error)', fontSize: '0.75rem', marginTop: '4px', display: 'block' }}>{errors.daysOfWeek}</span>}
              </div>
            )}

            <div style={{ marginBottom: '12px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem' }}>
                End condition (optional)
              </label>
              <select
                value={repeatRule.endCondition?.type || 'none'}
                onChange={e => {
                  const val = e.target.value;
                  if (val === 'none') {
                    setRepeatRule({ ...repeatRule, endCondition: undefined });
                  } else if (val === 'count') {
                    setRepeatRule({ ...repeatRule, endCondition: { type: 'count', count: 10 } });
                  } else if (val === 'date') {
                    const endDate = new Date();
                    endDate.setDate(endDate.getDate() + 30);
                    setRepeatRule({ ...repeatRule, endCondition: { type: 'date', date: endDate.toISOString().split('T')[0] } });
                  }
                }}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: '8px',
                  border: '1px solid var(--color-border)',
                  background: 'var(--color-background)',
                  color: 'var(--color-text)',
                }}
              >
                <option value="none">No end date</option>
                <option value="count">After N occurrences</option>
                <option value="date">On specific date</option>
              </select>

              {repeatRule.endCondition?.type === 'count' && (
                <input
                  type="number"
                  min="1"
                  value={repeatRule.endCondition.count}
                  onChange={e => {
                    const count = parseInt(e.target.value) || 1;
                    setRepeatRule({ ...repeatRule, endCondition: { type: 'count', count } });
                  }}
                  style={{
                    width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px',
                    border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)',
                  }}
                  placeholder="Number of occurrences"
                />
              )}

              {repeatRule.endCondition?.type === 'date' && (
                <input
                  type="date"
                  value={repeatRule.endCondition.date}
                  onChange={e => {
                    const date = e.target.value;
                    setRepeatRule({ ...repeatRule, endCondition: { type: 'date', date } });
                  }}
                  style={{
                    width: '100%', marginTop: '8px', padding: '10px', borderRadius: '8px',
                    border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)',
                  }}
                />
              )}
            </div>
          </fieldset>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.875rem' }}>
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={e => setNotes(e.target.value)}
              rows={3}
              placeholder="Any notes about this habit..."
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: '1rem',
                fontFamily: 'inherit',
                resize: 'vertical',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', marginBottom: '6px', fontWeight: 500, fontSize: '0.875rem' }}>
              Link to Goal (optional)
            </label>
            <input
              type="text"
              value={linkedGoalId}
              onChange={e => setLinkedGoalId(e.target.value)}
              placeholder="Goal ID (leave empty for none)"
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: '1rem',
                boxSizing: 'border-box',
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onCancel}
              style={{
                padding: '12px 20px',
                borderRadius: '8px',
                border: '1px solid var(--color-border)',
                background: 'var(--color-background)',
                color: 'var(--color-text)',
                fontSize: '1rem',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                background: 'var(--color-primary)',
                color: 'white',
                fontSize: '1rem',
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {isEditing ? 'Save Changes' : 'Create Habit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}