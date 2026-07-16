import { useState, type FormEvent, useRef } from 'react';
import { Card } from '../components/ui';
import {
  useInboxList,
  useCreateCapture,
  useUpdateCapture,
  useArchiveCapture,
  useConvertCapture,
  useDeleteCapture,
} from '../api/inbox';
import type { CaptureItem, ConvertTargetType } from '@whatdo/shared';

const TARGET_OPTIONS: { value: ConvertTargetType; label: string; icon: string }[] = [
  { value: 'task', label: 'Task', icon: 'check_box' },
  { value: 'planner_event', label: 'Planner Event', icon: 'calendar_month' },
  { value: 'habit', label: 'Habit', icon: 'local_fire_department' },
  { value: 'goal', label: 'Goal', icon: 'target' },
  { value: 'money_note', label: 'Money Note', icon: 'payments' },
];

/* ── Capture Form ── */

function CaptureForm({ onDone }: { onDone: () => void }) {
  const [text, setText] = useState('');
  const createCapture = useCreateCapture();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    createCapture.mutate(
      { rawText: text.trim(), source: 'manual' },
      { onSuccess: () => { setText(''); onDone(); } },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-start gap-3">
      <Card className="flex-1 p-[20px] flex items-start gap-3">
        <div className="flex-1 relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-500)] text-xl">edit_note</span>
          <input
            autoFocus
            value={text}
            onChange={e => setText(e.target.value)}
            placeholder="Type anything..."
            className="w-full clay-card-inset rounded-2xl pl-11 pr-4 py-3.5 bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] font-body text-[15px] text-[var(--ink-900)] placeholder:text-[var(--ink-500)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)]/30"
          />
        </div>
        <button
          type="submit"
          disabled={!text.trim() || createCapture.isPending}
          className="clay-button bg-[var(--blue-500)] text-white rounded-2xl px-6 py-3.5 font-body text-[15px] font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 transition-transform flex items-center gap-2"
        >
          {createCapture.isPending ? (
            <span className="material-symbols-outlined animate-spin text-lg">sync</span>
          ) : (
            <span className="material-symbols-outlined text-lg">add_circle</span>
          )}
          <span className="hidden sm:inline">Capture</span>
        </button>
      </Card>
    </form>
  );
}

/* ── Status Badge ── */

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    unprocessed: 'bg-[var(--blue-500)]/10 text-[var(--blue-500)]',
    processed: 'bg-[var(--semantic-green)]/10 text-[var(--semantic-green)]',
    archived: 'bg-[var(--clay-surface-alt)] text-[var(--ink-500)]',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-body text-[11px] font-semibold ${styles[status] || styles.archived}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${
        status === 'unprocessed' ? 'bg-[var(--blue-500)]' :
        status === 'processed' ? 'bg-[var(--semantic-green)]' : 'bg-[var(--ink-500)]'
      }`} />
      {status}
    </span>
  );
}

/* ── Capture Item Row ── */

function CaptureItemRow({
  item,
  onArchive,
  onConvert,
  onDelete,
  onTogglePin,
  onMarkProcessed,
  onRevertUnprocessed,
}: {
  item: CaptureItem;
  onArchive: (id: string) => void;
  onConvert: (id: string, targetType: ConvertTargetType) => void;
  onDelete: (id: string) => void;
  onTogglePin: (id: string, pinned: boolean) => void;
  onMarkProcessed: (id: string) => void;
  onRevertUnprocessed: (id: string) => void;
}) {
  const [showConvert, setShowConvert] = useState(false);

  return (
    <Card className={`relative overflow-hidden transition-all duration-200 hover:scale-[1.01] ${item.pinned ? 'ring-2 ring-[var(--blue-500)]/20' : ''}`}>
      {item.pinned && (
        <div className="absolute top-0 right-0 w-20 h-20">
          <div className="absolute top-3 right-3 rotate-12">
            <span className="material-symbols-outlined text-lg text-[var(--blue-500)]" style={{ fontVariationSettings: "'FILL' 1" }}>push_pin</span>
          </div>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2">
            <span className={`material-symbols-outlined text-xl ${
              item.status === 'processed' ? 'text-[var(--semantic-green)]' : item.status === 'archived' ? 'text-[var(--ink-500)]' : 'text-[var(--blue-500)]'
            }`} style={{ fontVariationSettings: "'FILL' 1" }}>
              {item.status === 'processed' ? 'check_circle' : item.status === 'archived' ? 'archive' : 'radio_button_unchecked'}
            </span>
            <p className="font-body text-[15px] leading-[22px] font-medium text-[var(--ink-900)] flex-1">
              {item.rawText}
            </p>
          </div>
          <div className="flex items-center flex-wrap gap-2 ml-9">
            <StatusBadge status={item.status} />
            {item.source !== 'manual' && (
              <span className="font-body text-[11px] text-[var(--ink-500)]">{item.source}</span>
            )}
            {item.detectedDate && (
              <span className="flex items-center gap-1 font-body text-[11px] text-[var(--ink-500)]">
                <span className="material-symbols-outlined text-sm">calendar_today</span>
                {item.detectedDate}
              </span>
            )}
            {item.convertedToType && (
              <span className="flex items-center gap-1 font-body text-[11px] text-[var(--ink-500)]">
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
                {item.convertedToType.replace('_', ' ')}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          {item.status === 'unprocessed' && (
            <>
              <button
                onClick={() => setShowConvert(true)}
                className="clay-button p-2.5 rounded-xl bg-[var(--blue-500)]/10 text-[var(--blue-500)] hover:bg-[var(--blue-500)]/20 transition-all hover:scale-105"
                title="Convert"
              >
                <span className="material-symbols-outlined text-lg">swap_horiz</span>
              </button>
              <button
                onClick={() => onMarkProcessed(item.id)}
                className="clay-button p-2.5 rounded-xl bg-[var(--semantic-green)]/10 text-[var(--semantic-green)] hover:bg-[var(--semantic-green)]/20 transition-all hover:scale-105"
                title="Mark processed"
              >
                <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
              </button>
            </>
          )}
          {item.status === 'processed' && (
            <button
              onClick={() => onRevertUnprocessed(item.id)}
              className="clay-button p-2.5 rounded-xl bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] text-[var(--ink-500)] hover:text-[var(--blue-500)] transition-all hover:scale-105"
              title="Revert to unprocessed"
            >
              <span className="material-symbols-outlined text-lg">undo</span>
            </button>
          )}
          {item.status !== 'archived' && (
            <>
              <button
                onClick={() => onTogglePin(item.id, !item.pinned)}
                className="clay-button p-2.5 rounded-xl bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] text-[var(--ink-500)] hover:text-[var(--blue-500)] transition-all hover:scale-105"
                title={item.pinned ? 'Unpin' : 'Pin'}
              >
                <span className="material-symbols-outlined text-lg">{item.pinned ? 'push_pin' : 'keep'}</span>
              </button>
              <button
                onClick={() => onArchive(item.id)}
                className="clay-button p-2.5 rounded-xl bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] text-[var(--ink-500)] hover:text-[var(--blue-500)] transition-all hover:scale-105"
                title="Archive"
              >
                <span className="material-symbols-outlined text-lg">archive</span>
              </button>
            </>
          )}
          <button
            onClick={() => onDelete(item.id)}
            className="clay-button p-2.5 rounded-xl bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] text-[var(--ink-500)] hover:text-[var(--semantic-red)] transition-all hover:scale-105"
            title="Delete"
          >
            <span className="material-symbols-outlined text-lg">delete</span>
          </button>
        </div>
      </div>

      {showConvert && (
        <ConvertModal
          itemText={item.rawText}
          onSelect={(targetType) => { onConvert(item.id, targetType); setShowConvert(false); }}
          onClose={() => setShowConvert(false)}
        />
      )}
    </Card>
  );
}

/* ── Convert Modal ── */

function ConvertModal({
  itemText,
  onSelect,
  onClose,
}: {
  itemText: string;
  onSelect: (targetType: ConvertTargetType) => void;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={onClose}>
      <Card className="p-[24px] w-full max-w-sm mx-4 animate-in fade-in zoom-in duration-200" onClick={e => e.stopPropagation()}>
        <h3 className="font-body text-[18px] font-semibold text-[var(--ink-900)] mb-1">Convert to...</h3>
        <p className="font-body text-[13px] text-[var(--ink-500)] mb-5 line-clamp-2">"{itemText}"</p>
        <div className="flex flex-col gap-2">
          {TARGET_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => onSelect(opt.value)}
              className="flex items-center gap-3 w-full text-left px-4 py-3.5 rounded-2xl clay-card-inset font-body text-[14px] font-medium text-[var(--ink-900)] hover:bg-[var(--blue-500)]/10 transition-all hover:scale-[1.02]"
            >
              <span className="material-symbols-outlined text-xl text-[var(--blue-500)]" style={{ fontVariationSettings: "'FILL' 1" }}>{opt.icon}</span>
              {opt.label}
            </button>
          ))}
        </div>
        <button onClick={onClose} className="w-full mt-4 py-3 rounded-2xl clay-card-inset font-body text-[13px] font-medium text-[var(--ink-500)] hover:text-[var(--blue-500)] transition-all">
          Cancel
        </button>
      </Card>
    </div>
  );
}

/* ── Main Page ── */

export function InboxPage() {
  const [filter, setFilter] = useState<'all' | 'unprocessed' | 'processed' | 'archived'>('all');
  const [search, setSearch] = useState('');
  const [sortDesc, setSortDesc] = useState(true);
  const formRef = useRef<HTMLDivElement>(null);

  const statusFilter = filter === 'all' ? undefined : filter;
  const { data: items = [], isLoading, error } = useInboxList(statusFilter, search || undefined);

  const createCapture = useCreateCapture();
  const updateCapture = useUpdateCapture();
  const archiveCapture = useArchiveCapture();
  const convertCapture = useConvertCapture();
  const deleteCapture = useDeleteCapture();

  const sorted = sortDesc ? items : [...items].reverse();

  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-body text-[28px] leading-[36px] font-bold text-[var(--ink-900)] flex items-center gap-3">
            <span className="material-symbols-outlined text-3xl text-[var(--blue-500)]" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
            Inbox
          </h1>
          <p className="font-body text-[13px] leading-[18px] text-[var(--ink-500)] mt-1">
            Capture ideas before they slip away
          </p>
        </div>
        <button
          onClick={() => formRef.current?.querySelector('input')?.focus()}
          className="clay-button bg-[var(--blue-500)] text-white rounded-full px-6 py-3 font-body text-[14px] font-semibold hover:scale-105 transition-transform flex items-center gap-2 shadow-lg"
        >
          <span className="material-symbols-outlined text-lg">add_circle</span>
          Capture
        </button>
      </div>

      {/* Quick capture bar */}
      <div ref={formRef}>
        <CaptureForm onDone={() => {}} />
      </div>

      {/* Filters + Search + Sort */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-1 clay-card-inset rounded-2xl p-1">
          {(['all', 'unprocessed', 'processed', 'archived'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl font-body text-[12px] font-semibold transition-all focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:outline-none ${
                filter === f ? 'bg-[var(--blue-500)] text-white shadow-sm' : 'text-[var(--ink-500)] hover:text-[var(--blue-500)]'
              }`}
            >
              {f === 'all' ? 'All' : f.charAt(0).toUpperCase() + f.slice(1)}
            </button>
          ))}
        </div>

        <div className="flex-1 min-w-[200px] relative">
          <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-[var(--ink-500)] text-lg">search</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search..."
            className="w-full clay-card-inset rounded-2xl py-2.5 pl-11 pr-4 bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] font-body text-[14px] text-[var(--ink-900)] placeholder:text-[var(--ink-500)] focus:outline-none focus:ring-2 focus:ring-[var(--blue-500)]/30"
          />
        </div>

        <button
          onClick={() => setSortDesc(!sortDesc)}
          className="clay-button px-4 py-2.5 rounded-2xl bg-[var(--clay-surface-alt)] dark:bg-[var(--clay-surface-alt)] text-[var(--ink-500)] hover:text-[var(--blue-500)] transition-all hover:scale-105 flex items-center gap-2 font-body text-[12px] font-semibold focus-visible:ring-2 focus-visible:ring-[var(--blue-500)] focus-visible:outline-none"
          title={sortDesc ? 'Newest first' : 'Oldest first'}
        >
          <span className="material-symbols-outlined text-lg">sort</span>
          {sortDesc ? 'Newest' : 'Oldest'}
        </button>
      </div>

      {/* Error */}
      {error && (
        <Card level={1} className="p-4 border border-[var(--semantic-red)]/30">
          <div className="flex items-center gap-3">
            <span className="material-symbols-outlined text-2xl text-[var(--semantic-red)]">error</span>
            <p className="font-body text-[15px] text-[var(--semantic-red)]">Failed to load inbox items.</p>
          </div>
        </Card>
      )}

      {/* Loading */}
      {isLoading && (
        <div className="flex items-center justify-center py-16">
          <span className="material-symbols-outlined text-3xl text-[var(--blue-500)] animate-spin">sync</span>
        </div>
      )}

      {/* Empty state */}
      {!isLoading && !error && sorted.length === 0 && (
        <Card className="p-[32px] text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-[var(--blue-500)]/10 flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl text-[var(--blue-500)]" style={{ fontVariationSettings: "'FILL' 1" }}>inbox</span>
          </div>
          <h3 className="font-body text-[20px] font-semibold text-[var(--ink-900)]">Inbox is empty</h3>
          <p className="font-body text-[14px] text-[var(--ink-500)] mt-2">
            Drop a quick note above to get started.
          </p>
        </Card>
      )}

      {/* Items */}
      {!isLoading && sorted.length > 0 && (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between mb-1">
            <p className="font-body text-[14px] font-medium text-[var(--ink-500)]">
              {sorted.length} item{sorted.length !== 1 ? 's' : ''}
            </p>
          </div>
          {sorted.map((item) => (
            <CaptureItemRow
              key={item.id}
              item={item}
              onArchive={(id) => archiveCapture.mutate(id)}
              onConvert={(id, targetType) => convertCapture.mutate({ id, targetType })}
              onDelete={(id) => deleteCapture.mutate(id)}
              onTogglePin={(id, pinned) => updateCapture.mutate({ id, pinned })}
              onMarkProcessed={(id) => updateCapture.mutate({ id, status: 'processed' })}
              onRevertUnprocessed={(id) => updateCapture.mutate({ id, status: 'unprocessed' })}
            />
          ))}
        </div>
      )}
    </div>
  );
}
