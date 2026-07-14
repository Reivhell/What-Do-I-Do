import { useState } from 'react';
import { useTimeline, useDailySummary, useCreateAnnotation, useUpdateAnnotation, useDeleteAnnotation } from '../api/life-log';
import { Modal } from '../components/ui/Modal';
import { ClayInput } from '../components/ui/ClayInput';
import type { CreateAnnotationInput, UpdateAnnotationInput, TimelineItem } from '@whatdo/shared';

const SOURCE_ICONS: Record<string, string> = {
  activity: 'play_circle',
  planner: 'calendar_month',
  transaction: 'payments',
  habit: 'check_circle',
  annotation: 'edit_note',
};

const SOURCE_COLORS: Record<string, string> = {
  activity: 'clr-primary',
  planner: 'clr-secondary',
  transaction: 'clr-danger',
  habit: 'clr-success',
  annotation: 'clr-text-primary',
};

const SOURCE_BG: Record<string, string> = {
  activity: 'bg-clr-primary-20',
  planner: 'bg-clr-secondary-10',
  transaction: 'bg-clr-danger-10',
  habit: 'bg-clr-success-10',
  annotation: 'bg-clr-surface-container-high',
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
          <h1 className="font-[Plus Jakarta Sans] text-[28px] leading-[36px] font-bold tracking-tight clr-text-primary flex items-center gap-3">
            <span className="material-symbols-outlined clr-primary text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>bar_chart</span>
            Life Log
          </h1>
          <p className="font-[Plus Jakarta Sans] text-[14px] leading-[20px] font-normal clr-text-secondary mt-1">
            Your daily timeline — activities, plans, transactions, habits & notes.
          </p>
        </div>
      </div>

      {/* Date Navigator + Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-6">
        <div className="clay-card-inset rounded-full flex items-center px-4 py-2 flex-1 max-w-md">
          <span className="material-symbols-outlined clr-text-secondary mr-2 text-lg">search</span>
          <input
            className="bg-transparent border-none focus:ring-0 w-full font-[Plus Jakarta Sans] text-[13px] clr-text-primary placeholder:clr-text-secondary"
            placeholder="Search timeline..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="flex items-center gap-2 clay-card-inset rounded-full px-3 py-2">
          <button onClick={() => navigateDay(-1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-clr-surface-container-high clay-transition clr-text-secondary">
            <span className="material-symbols-outlined text-lg">chevron_left</span>
          </button>
          <div className="flex items-center gap-2 px-3">
            <span className="material-symbols-outlined clr-primary text-lg">calendar_today</span>
            <input
              type="date"
              value={selectedDate}
              onChange={e => setSelectedDate(e.target.value)}
              className="bg-transparent border-none focus:ring-0 font-[Plus Jakarta Sans] text-[13px] font-medium clr-text-primary"
            />
          </div>
          <button onClick={() => navigateDay(1)} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-clr-surface-container-high clay-transition clr-text-secondary">
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
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-[Plus Jakarta Sans] text-[12px] font-medium transition-all ${
              activeSources.includes(key)
                ? `${SOURCE_BG[key]} ${SOURCE_COLORS[key]}`
                : 'clay-card-inset clr-text-secondary opacity-60'
            }`}
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
            <h3 className="font-[Plus Jakarta Sans] text-[14px] font-semibold clr-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined clr-primary text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>analytics</span>
              Daily Summary
            </h3>
            <span className="font-[Plus Jakarta Sans] text-[13px] font-bold clr-primary">{summary.total} total entries</span>
          </div>
          <div className="grid grid-cols-5 gap-4">
            {[
              { label: 'Activities', count: summary.totalActivities, color: 'clr-primary', icon: 'play_circle' },
              { label: 'Planned', count: summary.totalPlannerEvents, color: 'clr-secondary', icon: 'calendar_month' },
              { label: 'Transactions', count: summary.totalTransactions, color: 'clr-danger', icon: 'payments' },
              { label: 'Habits', count: summary.totalHabitLogs, color: 'clr-success', icon: 'check_circle' },
              { label: 'Notes', count: summary.totalAnnotations, color: 'clr-text-primary', icon: 'edit_note' },
            ].map(item => (
              <div key={item.label} className="text-center">
                <span className={`material-symbols-outlined ${item.color} text-xl`} style={{ fontVariationSettings: "'FILL' 1" }}>{item.icon}</span>
                <p className="font-[Plus Jakarta Sans] text-[18px] font-bold clr-text-primary mt-1">{item.count}</p>
                <p className="font-[Plus Jakarta Sans] text-[10px] font-medium clr-text-secondary">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Timeline */}
      <div className="relative">
        {timelineLoading ? (
          <div className="clay-card p-8 text-center">
            <p className="font-[Plus Jakarta Sans] clr-text-secondary">Loading timeline...</p>
          </div>
        ) : timeline.length === 0 ? (
          <div className="clay-card p-8 text-center">
            <span className="material-symbols-outlined text-4xl clr-text-secondary mb-3">timeline</span>
            <p className="font-[Plus Jakarta Sans] text-[14px] clr-text-secondary">No entries for this day.</p>
            <p className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary mt-1">Add an annotation or check other sources.</p>
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
        <button
          onClick={() => setShowAnnotationForm(true)}
          className="fixed bottom-8 right-8 w-14 h-14 rounded-full bg-clr-primary clr-on-primary clay-button flex items-center justify-center shadow-lg hover:scale-110 transition-transform z-40"
        >
          <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>edit_note</span>
        </button>
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
  const color = SOURCE_COLORS[item.source] || 'clr-text-primary';
  const bg = SOURCE_BG[item.source] || 'bg-clr-surface-container-high';
  const label = SOURCE_LABELS[item.source] || item.source;

  const time = item.timestamp?.includes('T')
    ? item.timestamp.split('T')[1]?.slice(0, 5)
    : item.timestamp?.slice(11, 16) || '';

  return (
    <div className="clay-card p-5 flex items-start gap-4 relative group">
      {/* Timeline dot line */}
      <div className="flex flex-col items-center shrink-0">
        <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center ${color}`}>
          <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className="font-[Plus Jakarta Sans] text-[11px] font-medium clr-text-secondary">{label}</span>
          {time && (
            <>
              <span className="text-clr-text-secondary">·</span>
              <span className="font-[Plus Jakarta Sans] text-[11px] font-medium clr-text-secondary tabular-nums">{time}</span>
            </>
          )}
        </div>
        <p className="font-[Plus Jakarta Sans] text-[15px] font-semibold clr-text-primary">{item.title}</p>

        {/* Source-specific details */}
        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
          {item.durationMinutes != null && (
            <span className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary">{item.durationMinutes}m</span>
          )}
          {item.amount != null && (
            <span className={`font-[Plus Jakarta Sans] text-[12px] font-medium ${
              item.type === 'income' ? 'clr-success' : item.type === 'expense' ? 'clr-danger' : 'clr-text-primary'
            }`}>
              {item.type === 'income' ? '+' : item.type === 'expense' ? '-' : ''}Rp {item.amount.toLocaleString()}
            </span>
          )}
          {item.category && item.source === 'planner' && (
            <span className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary">{item.category}</span>
          )}
          {item.status && (
            <span className={`font-[Plus Jakarta Sans] text-[12px] capitalize ${
              item.status === 'completed' || item.status === 'done' ? 'clr-success' :
              item.status === 'skipped' ? 'clr-text-secondary' :
              item.status === 'missed' ? 'clr-danger' : 'clr-text-secondary'
            }`}>{item.status}</span>
          )}
        </div>

        {item.description && (
          <p className="font-[Plus Jakarta Sans] text-[12px] clr-text-secondary mt-1 line-clamp-2">{item.description}</p>
        )}

        {/* Annotation note */}
        {item.note && (
          <div className="clay-card-inset rounded-xl p-3 mt-2">
            <p className="font-[Plus Jakarta Sans] text-[12px] clr-text-primary italic">{item.note}</p>
          </div>
        )}
      </div>

      {/* Edit/Delete for annotations */}
      {item.source === 'annotation' && (
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button onClick={onEdit} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-clr-surface-container-high clr-text-secondary clay-transition">
              <span className="material-symbols-outlined text-lg">edit</span>
            </button>
          )}
          {onDelete && (
            <button onClick={onDelete} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-clr-danger-10 clr-danger clay-transition">
              <span className="material-symbols-outlined text-lg">delete</span>
            </button>
          )}
        </div>
      )}
    </div>
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
        <label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Description</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="Brief description..."
          rows={2}
          className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary placeholder-clr-text-muted resize-none"
        />
      </div>
      <div className="flex flex-col gap-1.5">
        <label className="font-[Plus Jakarta Sans] text-[12px] font-semibold uppercase tracking-[0.04em] clr-text-secondary">Note</label>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          placeholder="Detailed note..."
          rows={3}
          className="clay-card-inset p-3 rounded-2xl w-full bg-clr-surface-white dark:bg-clr-surface-container-high font-[Plus Jakarta Sans] text-sm clr-text-primary placeholder-clr-text-muted resize-none"
        />
      </div>
      <div className="flex gap-3 pt-2">
        <button type="button" onClick={onCancel} className="flex-1 py-3 rounded-2xl clay-card-inset font-[Plus Jakarta Sans] text-[13px] font-medium clr-text-secondary">Cancel</button>
        <button type="submit" className="flex-1 py-3 rounded-2xl bg-clr-primary clr-on-primary font-[Plus Jakarta Sans] text-[13px] font-medium clay-button">
          {initial ? 'Update' : 'Save'}
        </button>
      </div>
    </form>
  );
}
