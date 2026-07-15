import { useState, useEffect, useRef, type FormEvent } from 'react';
import {
  Play, Square, Clock, History, Plus, Search, Trash2,
  Timer, Pencil, X, Loader2,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, Badge, Button, Input, Modal, EmptyState } from '../components/ui';
import {
  useActiveSession,
  useActivityHistory,
  useStartActivity,
  useStopActivity,
  useManualLog,
  useUpdateActivity,
  useDeleteActivity,
} from '../api/activity';
import type { ActivitySession } from '@whatdo/shared';

/* ── Helpers ── */
function fmtTimer(totalSeconds: number) {
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('en-ID', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

function elapsedSeconds(session: ActivitySession): number {
  const start = new Date(session.startTime).getTime();
  const end = session.endTime ? new Date(session.endTime).getTime() : Date.now();
  return Math.floor((end - start) / 1000);
}

/* ── Live Timer ── */
function LiveTimerCard() {
  const { data: active, isLoading: loadingActive } = useActiveSession();
  const stopActivity = useStopActivity();
  const [now, setNow] = useState(Date.now());
  const justRecovered = useRef(true);
  const [showRecovery, setShowRecovery] = useState(false);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (active && justRecovered.current) {
      justRecovered.current = false;
      setShowRecovery(true);
    }
  }, [active]);

  if (loadingActive) {
    return (
      <Card level={2} className="flex items-center justify-center py-10">
        <Loader2 className="size-6 animate-spin text-ink-300" />
      </Card>
    );
  }

  if (active) {
    const secs = elapsedSeconds(active);
    return (
      <>
        <Card level={2} className="!p-6">
          <div className="flex flex-col items-center gap-4 text-center">
            <Timer className="size-6 text-blue-500" />
            <div>
              <p className="font-display text-lg font-semibold text-ink-900">{active.activityName}</p>
              <Badge variant="info">{active.category}</Badge>
            </div>
            <p className="font-display text-5xl font-bold tabular-nums text-blue-600">{fmtTimer(secs)}</p>
            <Button
              variant="destructive"
              size="lg"
              onClick={() => stopActivity.mutate(active.id)}
              disabled={stopActivity.isPending}
            >
              {stopActivity.isPending ? <Loader2 className="size-5 animate-spin" /> : <Square className="size-5" />}
              Stop
            </Button>
          </div>
        </Card>

        {showRecovery && (
          <Modal open={showRecovery} onClose={() => setShowRecovery(false)} title="Timer Ditemukan">
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <Timer className="size-10 text-semantic-amber" />
              <p className="font-body text-[15px] text-ink-700">
                Timer untuk <strong>{active.activityName}</strong> masih berjalan dari sesi sebelumnya.
              </p>
              <p className="font-display text-3xl font-bold tabular-nums text-blue-600">{fmtTimer(secs)}</p>
              <div className="flex gap-3">
                <Button variant="primary" onClick={() => setShowRecovery(false)}>
                  Lanjutkan
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    setShowRecovery(false);
                    stopActivity.mutate(active.id);
                  }}
                  disabled={stopActivity.isPending}
                >
                  Stop Sekarang
                </Button>
              </div>
            </div>
          </Modal>
        )}
      </>
    );
  }

  return null;
}

/* ── Start Activity Form ── */
function StartActivityForm({ categories }: { categories: string[] }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const startActivity = useStartActivity();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || startActivity.isPending) return;
    startActivity.mutate(
      { activityName: name.trim(), category },
      { onSuccess: () => { setName(''); setCategory(''); } },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="What are you working on?"
        className="flex-1 rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-300 clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
      />
      <select
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        className="rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
      >
        <option value="">Category</option>
        {categories.map((c) => (
          <option key={c} value={c}>{c}</option>
        ))}
      </select>
      <Button type="submit" disabled={!name.trim() || !category || startActivity.isPending} size="md">
        {startActivity.isPending ? <Loader2 className="size-5 animate-spin" /> : <Play className="size-5" />}
        Start
      </Button>
    </form>
  );
}

/* ── Manual Log Form ── */
function ManualLogForm({ categories, onClose }: { categories: string[]; onClose: () => void }) {
  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endDate, setEndDate] = useState('');
  const [endTime, setEndTime] = useState('');
  const [note, setNote] = useState('');
  const manualLog = useManualLog();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !category || !startDate || !startTime || !endDate || !endTime) return;
    const startTimeIso = new Date(`${startDate}T${startTime}`).toISOString();
    const endTimeIso = new Date(`${endDate}T${endTime}`).toISOString();
    manualLog.mutate(
      { activityName: name.trim(), category, startTime: startTimeIso, endTime: endTimeIso, note: note.trim() || undefined },
      { onSuccess: () => { setName(''); setCategory(''); setStartDate(''); setStartTime(''); setEndDate(''); setEndTime(''); setNote(''); onClose(); } },
    );
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Activity name"
          className="flex-1 rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-300 clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
        >
          <option value="">Category</option>
          {categories.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="flex-1">
          <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-1 block">Start</label>
          <div className="flex gap-2">
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="flex-1 rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset" />
            <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="flex-1 rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset" />
          </div>
        </div>
        <div className="flex-1">
          <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-1 block">End</label>
          <div className="flex gap-2">
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="flex-1 rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset" />
            <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="flex-1 rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset" />
          </div>
        </div>
      </div>
      <input
        value={note}
        onChange={(e) => setNote(e.target.value)}
        placeholder="Note (optional)"
        className="rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-300 clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
      />
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
        <Button type="submit" disabled={!name.trim() || !category || !startDate || !startTime || !endDate || !endTime || manualLog.isPending}>
          {manualLog.isPending ? <Loader2 className="size-5 animate-spin" /> : <Plus className="size-5" />}
          Log
        </Button>
      </div>
    </form>
  );
}

/* ── History Row ── */
function HistoryRow({
  session,
  onDelete,
  onEdit,
}: {
  session: ActivitySession;
  onDelete: (id: string) => void;
  onEdit: (session: ActivitySession) => void;
}) {
  const secs = elapsedSeconds(session);
  return (
    <div className="group flex items-start gap-4 rounded-[--radius-md] bg-clay-surface px-4 py-3 clay-l1">
      <div className="min-w-0 flex-1">
        <div className="mb-0.5 flex items-center gap-2">
          <span className="font-body text-[15px] font-semibold text-ink-900">{session.activityName}</span>
          <Badge variant="info">{session.category}</Badge>
          <Badge variant={session.source === 'live' ? 'warning' : 'default'}>{session.source}</Badge>
        </div>
        <p className="font-body text-[13px] text-ink-400">
          {fmtDate(session.startTime)} – {session.endTime ? fmtDate(session.endTime) : 'now'}
          {session.durationMinutes && ` · ${session.durationMinutes}m`}
        </p>
        {session.note && <p className="mt-1 font-body text-[13px] italic text-ink-500">{session.note}</p>}
      </div>
      <div className="flex shrink-0 items-center gap-1 opacity-0 clay-transition group-hover:opacity-100">
        <button onClick={() => onEdit(session)} className="tap-target flex size-8 items-center justify-center rounded-[--radius-sm] text-ink-400 hover:bg-blue-50 hover:text-blue-600" title="Edit">
          <Pencil className="size-4" />
        </button>
        <button onClick={() => onDelete(session.id)} className="tap-target flex size-8 items-center justify-center rounded-[--radius-sm] text-ink-400 hover:bg-red-50 hover:text-red-500" title="Delete">
          <Trash2 className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ── Edit Modal ── */
function EditModal({
  session,
  onClose,
}: {
  session: ActivitySession;
  onClose: () => void;
}) {
  const [duration, setDuration] = useState(String(session.durationMinutes || elapsedSeconds(session) / 60));
  const [note, setNote] = useState(session.note || '');
  const updateActivity = useUpdateActivity();

  const handleSave = () => {
    const dur = parseInt(duration, 10);
    if (isNaN(dur) || dur < 1) return;
    updateActivity.mutate(
      { id: session.id, durationMinutes: dur, note: note || null },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open onClose={onClose} title="Edit Session">
      <div className="flex flex-col gap-4">
        <p className="font-body text-[15px] text-ink-900"><span className="text-ink-500">Activity:</span> {session.activityName}</p>
        <Input
          label="Duration (minutes)"
          type="number"
          min={1}
          value={duration}
          onChange={(e) => setDuration(e.target.value)}
        />
        <Input
          label="Note"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add a note..."
        />
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSave} disabled={updateActivity.isPending}>
            {updateActivity.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
            Save
          </Button>
        </div>
      </div>
    </Modal>
  );
}

/* ── Page ── */
const DEFAULT_CATEGORIES = ['Work', 'Study', 'Exercise', 'Leisure', 'Chores', 'Social', 'Health', 'Creative', 'Other'];

export function ActivityTrackerPage() {
  const [filter, setFilter] = useState('');
  const [showManualLog, setShowManualLog] = useState(false);
  const [editingSession, setEditingSession] = useState<ActivitySession | null>(null);
  const [categories] = useState(DEFAULT_CATEGORIES);

  const { data: history = [], isLoading: loadingHistory } = useActivityHistory(
    filter ? { search: filter } : undefined,
  );
  const deleteActivity = useDeleteActivity();

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-ink-900">Activity Tracker</h1>
        <p className="mt-1 font-body text-[15px] text-ink-500">
          Track what you actually do, not just what you planned.
        </p>
      </div>

      {/* Live Timer */}
      <LiveTimerCard />

      {/* Start Activity */}
      <Card level={2} className="!p-4">
        <CardTitle>Start Activity</CardTitle>
        <div className="mt-3">
          <StartActivityForm categories={categories} />
        </div>
      </Card>

      {/* History header + Manual Log trigger */}
      <div className="flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold text-ink-900">History</h2>
        <Button variant="secondary" size="sm" onClick={() => setShowManualLog(true)}>
          <Plus className="size-4" />
          Manual Log
        </Button>
      </div>

      {/* Search / Filter */}
      <Input
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        placeholder="Search by activity name..."
        icon={<Search className="size-4" />}
      />

      {/* History list */}
      {loadingHistory && (
        <div className="flex justify-center py-8 text-ink-300">
          <Loader2 className="size-6 animate-spin" />
        </div>
      )}

      {!loadingHistory && history.length === 0 && (
        <EmptyState
          icon={<History className="size-8" />}
          title="No activity yet"
          description="Start a timer or log an activity manually."
        />
      )}

      {!loadingHistory && history.length > 0 && (
        <div className="flex flex-col gap-2">
          {history.map((s) => (
            <HistoryRow
              key={s.id}
              session={s}
              onDelete={(id) => deleteActivity.mutate(id)}
              onEdit={setEditingSession}
            />
          ))}
        </div>
      )}

      {/* Manual Log Modal */}
      {showManualLog && (
        <Modal open={showManualLog} onClose={() => setShowManualLog(false)} title="Manual Log">
          <ManualLogForm categories={categories} onClose={() => setShowManualLog(false)} />
        </Modal>
      )}

      {/* Edit Modal */}
      {editingSession && (
        <EditModal session={editingSession} onClose={() => setEditingSession(null)} />
      )}
    </div>
  );
}
