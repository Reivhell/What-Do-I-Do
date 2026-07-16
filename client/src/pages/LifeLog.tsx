import { useState } from 'react';
import { useTimeline, useDailySummary, useCreateAnnotation, useUpdateAnnotation, useDeleteAnnotation } from '../api/life-log';
import { Modal } from '../components/ui/Modal';
import { ClayInput } from '../components/ui/ClayInput';
import { Button, FAB } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import type { CreateAnnotationInput, UpdateAnnotationInput, TimelineItem } from '@whatdo/shared';

const SOURCE_ICONS: Record<string, string> = {
  activity: 'play_circle',
  planner: 'calendar_month',
  transaction: 'payments',
  habit: 'check_circle',
  annotation: 'edit_note',
};

// status-only semantic colors (applied via inline style)
const SOURCE_COLORS: Record<string, string> = {
  activity: 'var(--blue-500)',
  planner: 'var(--blue-500)',
  transaction: 'var(--semantic-red)',
  habit: 'var(--semantic-green)',
  annotation: 'var(--ink-500)',
};

// background tints as Tailwind arbitrary classes
const SOURCE_BG: Record<string, string> = {
  activity: 'bg-[var(--blue-500)]/10',
  planner: 'bg-[var(--blue-500)]/10',
  transaction: 'bg-[var(--semantic-red)]/10',
  habit: 'bg-[var(--semantic-green)]/10',
  annotation: 'bg-[var(--ink-500)]/10',
};

const SOURCE_LABELS: Record<string, string> = {
  activity: 'Activity',
  planner: 'Planned',
  transaction: 'Transaction',
  habit: 'Habit',
  annotation: 'Note',
};

export function LifeLogPage() {
  const today = new Date().toISOString().split('T')[0];
  const [selectedDate, setSelectedDate] = useState(today);
  const [activeSources, setActiveSources] = useState<string[]>(['activity', 'planner', 'transaction', 'habit', 'annotation']);
  const [search, setSearch] = useState('');
  const [showAnnotationForm, setShowAnnotationForm] = useState(false);
  const [editingAnnotation, setEditingAnnotation] = useState<TimelineItem | null>(null);

  const { data: timeline = [], isLoading: timelineLoading } = useTimeline(selectedDate, activeSources, search || undefined);
  const { data: summary, isLoading: summaryLoading } = useDailySummary(selectedDate);

  const createAnnotation = useCreateAnnotation();
  const updateAnnotation = useUpdateAnnotation();
  const deleteAnnotation = useDeleteAnnotation();

  const toggleSource = (source: string) => {
    setActiveSources(prev =>
      prev.includes(source) ? prev.filter(s => s !== source) : [...prev, source],
    );
  };

  const navigateDay = (offset: number) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    setSelectedDate(d.toISOString().split('T')[0]);
  };

  return (
    <div className="p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="font-body text-[28px] leading-[36px] font-bold tracking-tight text-[var(--ink-900)] flex items-center gap-3">
            <span className="material-symbols-outlined text-[var(--blue-500)] text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            Life Log
          </h1>
          <p className="font-body text-[14px] leading-[20px] font-normal text-[var(--ink-500)] mt-1">
            Your daily timeline — activities, plans, transactions, habits & notes.
          </p>
        </div>
      </div>

      {/* Date Navigator + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="bg-clay-surface clay-l1 rounded-full flex items-center px-4 py-2 flex-1 max-w-md">
          <span className="material-symbols-outlined text-[var(--ink-500)] mr-2 text-lg">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 w-full font-body text-[13px] text-[var(--ink-900)] placeholder:text-[var(--ink-500)]"
            placeholder="Search timeline..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 bg-clay-surface clay-l1 rounded-full px-3 py-2">
          <button onClick={() => navigateDay(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-clay-surface clay-transition text-[var(--ink-500)]">
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <div className="flex items-center gap-2 px-3">
            <span className="material-symbols-outlined text-[var(--blue-500)] text-lg">calendar_today</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-body text-[13px] font-medium text-[var(--ink-900)]"
            />
          </div>
          <button onClick={() => navigateDay(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-clay-surface clay-transition text-[var(--ink-500)]">
            <span className="material-symbols-outlined text-lg">chevron_right</span>
          </button>
        </div>
      </div>

      {/* Source Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(SOURCE_ICONS).map(([key, icon]) => (
          <button
            key={key}
            onClick={() => toggleSource(key)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[12px] font-medium transition-all ${
              activeSources.includes(key)
                ? `${SOURCE_BG[key]}`
                : 'opacity-60'
            }`}
            style={{ color: activeSources.includes(key) ? SOURCE_COLORS[key] : 'var(--ink-500)' }}
          >
            <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
            {SOURCE_LABELS[key]}
          </button>
        ))}
      </div>

      {/* Daily Summary */}
      {summary && !summaryLoading && (
        <div className="clay-card p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-body text-[14px] font-semibold text-[var(--ink-900)] flex items-center gap-2">
              <span className="material-symbols-outlined text-[var(--blue-500)] text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              Daily Summary
            </h3>
            <span className="font-body text-[13px] font-bold text-[var(--blue-500)]">{summary.total} total entries</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Activities', count: summary.totalActivities, color: 'var(--blue-500)', icon: 'play_circle' },
              { label: 'Planned', count: summary.totalPlannerEvents, color: 'var(--blue-500)', icon: 'calendar_month' },
              { label: 'Transactions', count: summary.totalTransactions, color: 'var(--semantic-red)', icon: 'payments' },
              { label: 'Habits', count: summary.totalHabitLogs, color: 'var(--semantic-green)', icon: 'check_circle' },
              { label: 'Notes', count: summary.totalAnnotations, color: 'var(--ink-500)', icon: 'edit_note' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1", color: item.color }}>{item.icon}</span>
                <p className="font-body text-[18px] font-bold text-[var(--ink-900)] mt-1">{item.count}</p>
                <p className="font-body text-[10px] font-medium text-[var(--ink-500)]">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {timelineLoading ? (
          <div className="clay-card p-8 text-center">
            <p className="font-body text-[var(--ink-500)]">Loading timeline...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="clay-card p-8 text-center">
            <span className="material-symbols-outlined text-4xl text-[var(--ink-500)] mb-3">timeline</span>
            <p className="font-body text-[14px] text-[var(--ink-500)]">No entries for this day.</p>
            <p className="font-body text-[12px] text-[var(--ink-500)] mt-1">Add an annotation or check other sources.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {timeline.map((item, idx) => (
              <TimelineCard
                key={`${item.source}-${item.id}-${idx}`}
                item={item}
                onEdit={item.source === 'annotation' ? () => setEditingAnnotation(item) : undefined}
                onDelete={item.source === 'annotation' ? () => deleteAnnotation.mutate(item.id) : undefined}
              />
            ))}
          </div>
        )}

        {/* Add annotation FAB */}
        <FAB onClick={() => setShowAnnotationForm(true)}>
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
        </FAB>
      </div>

      {/* Create Annotation Modal */}
      <Modal open={showAnnotationForm} onClose={() => setShowAnnotationForm(false)} title="Add Note">
        <AnnotationForm
          onSubmit={async (data) => {
            await createAnnotation.mutateAsync({ ...data, timestamp: `${selectedDate}T${new Date().toTimeString().slice(0, 5)}` });
            setShowAnnotationForm(false);
          }}
          onCancel={() => setShowAnnotationForm(false)}
        />
      </Modal>

      {/* Edit Annotation Modal */}
      {editingAnnotation && (
        <Modal open={!!editingAnnotation} onClose={() => setEditingAnnotation(null)} title="Edit Note">
          <AnnotationForm
            initial={{ title: editingAnnotation.title, description: editingAnnotation.description || '', note: editingAnnotation.note || '' }}
            onSubmit={async (data) => {
              await updateAnnotation.mutateAsync({ id: editingAnnotation.id, data });
              setEditingAnnotation(null);
            }}
            onCancel={() => setEditingAnnotation(null)}
          />
        </Modal>
      )}
    </div>
  );
}

// ── Timeline Card Component ──

function TimelineCard({
  item,
  onEdit,
  onDelete,
}: {
  item: TimelineItem;
  onEdit?: () => void;
  onDelete?: () => void;
}) {
  const icon = SOURCE_ICONS[item.source] || 'circle';
  const color = SOURCE_COLORS[item.source] || 'var(--ink-500)';
  const bg = SOURCE_BG[item.source] || 'bg-[var(--blue-500)]/10';
  const label = SOURCE_LABELS[item.source] || item.source;

  const time = item.timestamp?.includes('T')
    ? item.timestamp.split('T')[1]?.slice(0, 5)
    : item.timestamp?.slice(11, 16) || '';

  return (
    <Card level={1} className="flex items-start gap-4 relative group">
      {/* Timeline dot line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`} style={{ color }}>
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-body text-[11px] font-medium text-[var(--ink-500)]">{label}</span>
          {time && (
            <>
              <span className="text-[var(--ink-500)]">·</span>
              <span className="font-body text-[11px] font-medium text-[var(--ink-500)] tabular-nums">{time}</span>
            </>
          )}
        </div>

        <p className="font-body text-[15px] font-semibold text-[var(--ink-900)]">{item.title}</p>

        {/* Source-specific details */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          {item.durationMinutes != null && (
            <span className="font-body text-[12px] text-[var(--ink-500)]">{item.durationMinutes}m</span>
          )}
          {item.amount != null && (
            <span className={`font-body text-[12px] font-medium ${
              item.type === 'income' ? 'text-[var(--semantic-green)]' : item.type === 'expense' ? 'text-[var(--semantic-red)]' : 'text-[var(--ink-900)]'
            }`}>
              {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}Rp {item.amount.toLocaleString()}
            </span>
          )}
          {item.category && item.source === 'planner' && (
            <span className="font-body text-[12px] text-[var(--ink-500)]">{item.category}</span>
          )}
          {item.status && (
            <span className={`font-body text-[12px] capitalize ${
              item.status === 'completed' || item.status === 'done' ? 'text-[var(--semantic-green)]' :
              item.status === 'skipped' ? 'text-[var(--ink-500)]' :
              item.status === 'missed' ? 'text-[var(--semantic-red)]' : 'text-[var(--ink-500)]'
            }`}>{item.status}</span>
          )}
        </div>

        {item.description && (
          <p className="font-body text-[12px] text-[var(--ink-500)] mt-1 line-clamp-2">{item.description}</p>
        )}

        {/* Annotation note */}
        {item.note && (
          <div className="bg-clay-surface clay-l1 rounded-xl p-3 mt-2">
            <p className="font-body text-[12px] text-[var(--ink-900)] italic">{item.note}</p>
          </div>
        )}
      </div>

      {/* Edit/Delete for annotations */}
      {item.source === 'annotation' && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-clay-surface clay-transition text-[var(--ink-500)]">
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--semantic-red)]/10 text-[var(--semantic-red)] clay-transition">
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          )}
        </div>
      )}
    </Card>
  );
}

// ── Annotation Form ──

function AnnotationForm({
  initial,
  onSubmit,
  onCancel,
}: {
  initial?: { title: string; description?: string; note?: string };
  onSubmit: (data: CreateAnnotationInput) => Promise<void>;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [note, setNote] = useState(initial?.note || '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      timestamp: new Date().toISOString(),
      title,
      description: description || undefined,
      note: note || undefined,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <ClayInput label="Title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="What happened?" />
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description..."
          rows={2}
          className="p-3 rounded-2xl w-full bg-clay-surface text-sm font-body text-[var(--ink-900)] placeholder:text-[var(--ink-400)] resize-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)]">Note</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Detailed note..."
          rows={3}
          className="p-3 rounded-2xl w-full bg-clay-surface text-sm font-body text-[var(--ink-900)] placeholder:text-[var(--ink-400)] resize-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" size="md" className="flex-1" onClick={onCancel}>Cancel</Button>
        <Button variant="primary" size="md" className="flex-1" type="submit">{initial ? 'Update' : 'Save'}</Button>
      </div>
    </form>
  );
}
