import { useState, type FormEvent } from 'react';
import {
  Target, Plus, Trash2, CheckCircle2, Circle, Loader2,
  Pencil, Calendar, CalendarDays, ChevronDown, ChevronUp,
  AlertTriangle, Link,
} from 'lucide-react';
import { Card, Badge, Button, Modal, ProgressBar, EmptyState } from '../components/ui';
import {
  useGoalsList,
  useCreateGoal,
  useUpdateGoal,
  useDeleteGoal,
  useCreateMilestone,
  useUpdateMilestone,
  useDeleteMilestone,
  useScheduleMilestone,
  useLinkedItems,
  type GoalWithMilestones,
} from '../api/goals';

const STATUS_COLORS: Record<string, 'default' | 'warning' | 'success' | 'danger'> = {
  active: 'default',
  at_risk: 'danger',
  completed: 'success',
  archived: 'default',
};

/* ── Goal Card ── */
function GoalCard({
  goal,
  onToggleComplete,
  onAddMilestone,
  onToggleMilestone,
  onDeleteMilestone,
  onArchive,
  onEdit,
  onScheduleMilestone,
}: {
  goal: GoalWithMilestones;
  onToggleComplete: (id: string) => void;
  onAddMilestone: (goalId: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string, completed: boolean) => void;
  onDeleteMilestone: (goalId: string, milestoneId: string) => void;
  onArchive: (id: string) => void;
  onEdit: (goal: GoalWithMilestones) => void;
  onScheduleMilestone: (goalId: string, milestoneId: string) => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showLinked, setShowLinked] = useState(false);
  const { data: linkedItems = [] } = useLinkedItems(goal.id);

  return (
    <Card level={1} className={goal.status === 'at_risk' ? 'ring-2 ring-semantic-red/20' : ''}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {goal.status === 'at_risk' && <AlertTriangle className="size-4 text-semantic-red shrink-0" />}
            <Badge variant={STATUS_COLORS[goal.status] || 'default'}>{goal.status}</Badge>
            {goal.targetDate && (
              <span className="flex items-center gap-1 font-body text-[12px] text-[var(--ink-400)]">
                <Calendar className="size-3" />
                {goal.targetDate}
              </span>
            )}
          </div>
          <h3 className="font-display text-lg font-semibold text-[var(--ink-900)]">{goal.title}</h3>
          {goal.description && (
            <p className="font-body text-[14px] text-[var(--ink-500)] mt-1">{goal.description}</p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button onClick={() => onEdit(goal)} className="tap-target flex size-8 items-center justify-center rounded-[--radius-sm] text-[var(--ink-400)] hover:bg-blue-50 hover:text-blue-600 clay-l1 hover:clay-l2" title="Edit">
            <Pencil className="size-4" />
          </button>
          {goal.status !== 'archived' && (
            <button onClick={() => onArchive(goal.id)} className="tap-target flex size-8 items-center justify-center rounded-[--radius-sm] text-[var(--ink-400)] hover:bg-amber-50 hover:text-amber-600 clay-l1 hover:clay-l2" title="Archive">
              <ChevronDown className="size-4" />
            </button>
          )}
        </div>
      </div>

      {/* Progress */}
      <div className="mt-4">
        <div className="flex items-center justify-between mb-1">
          <span className="font-body text-[13px] font-semibold text-[var(--ink-500)]">Progress</span>
          <span className="font-body text-[13px] font-semibold text-[var(--ink-700)]">{goal.progressPercent}%</span>
        </div>
        <ProgressBar value={goal.progressPercent} />
      </div>

      {/* Milestones */}
      <div className="mt-4">
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1 font-body text-[13px] font-semibold text-[var(--ink-500)] hover:text-[var(--ink-900)]"
        >
          {expanded ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
          Milestones ({goal.milestones.filter((m) => m.isCompleted).length}/{goal.milestones.length})
        </button>

        {expanded && (
          <div className="mt-2 space-y-1.5">
            {goal.milestones.length === 0 && (
              <p className="font-body text-[13px] text-[var(--ink-400)] italic py-2">No milestones yet. Add one below.</p>
            )}
            {goal.milestones.map((m) => (
              <Card
                level={2}
                key={m.id}
                className="group flex items-center gap-3 rounded-[--radius-md] bg-clay-surface-alt px-3 py-2 clay-inset"
              >
                <button onClick={() => onToggleMilestone(goal.id, m.id, !m.isCompleted)} className="shrink-0">
                  {m.isCompleted ? (
                    <CheckCircle2 className="size-5 text-semantic-green" />
                  ) : (
                    <Circle className="size-5 text-[var(--ink-300)] hover:text-blue-500" />
                  )}
                </button>
                <span className={`flex-1 font-body text-[14px] ${m.isCompleted ? 'text-[var(--ink-400)] line-through' : 'text-[var(--ink-900)]'}`}>
                  {m.title}
                </span>
                {m.targetDate && (
                  <span className="font-body text-[11px] text-[var(--ink-400)]">{m.targetDate}</span>
                )}
                {m.generatedEventId ? (
                  <span className="shrink-0 text-blue-400" title="Scheduled to planner">
                    <CalendarDays className="size-3.5" />
                  </span>
                ) : (
                  <button
                    onClick={() => onScheduleMilestone(goal.id, m.id)}
                    className="shrink-0 opacity-0 group-hover:opacity-100 clay-transition text-[var(--ink-400)] hover:text-blue-500"
                    title="Schedule to planner"
                  >
                    <Calendar className="size-3.5" />
                  </button>
                )}
                <button
                  onClick={() => onDeleteMilestone(goal.id, m.id)}
                  className="shrink-0 opacity-0 group-hover:opacity-100 clay-transition text-[var(--ink-400)] hover:text-red-500"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </Card>
            ))}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onAddMilestone(goal.id)}
                className="flex items-center gap-1.5 rounded-[--radius-sm] px-3 py-1.5 font-body text-[13px] text-blue-600 hover:bg-blue-50 clay-l1 hover:clay-l2 clay-transition"
              >
                <Plus className="size-3.5" />
                Add milestone
              </button>
              {linkedItems.length > 0 && (
                <button
                  onClick={() => setShowLinked(!showLinked)}
                  className="flex items-center gap-1.5 rounded-[--radius-sm] px-3 py-1.5 font-body text-[13px] text-[var(--ink-500)] hover:text-blue-600 hover:bg-blue-50 clay-l1 hover:clay-l2 clay-transition"
                >
                  <Link className="size-3.5" />
                  {linkedItems.length} linked
                  {showLinked ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
                </button>
              )}
            </div>
            {showLinked && linkedItems.length > 0 && (
              <div className="mt-2 flex flex-col gap-1">
                {linkedItems.map((item) => (
                  <div key={`${item.type}-${item.id}`} className="flex items-center gap-2 rounded-[--radius-sm] bg-clay-surface-alt px-3 py-1.5 clay-inset">
                    <span className="font-body text-[11px] font-semibold uppercase tracking-wider text-[var(--ink-400)] w-8">{item.type}</span>
                    <span className="font-body text-[13px] text-[var(--ink-700)]">{item.title}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

/* ── Create/Edit Goal Modal ── */
function GoalFormModal({
  existing,
  onClose,
}: {
  existing?: GoalWithMilestones | null;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(existing?.title || '');
  const [description, setDescription] = useState(existing?.description || '');
  const [targetDate, setTargetDate] = useState(existing?.targetDate || '');
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (existing) {
      updateGoal.mutate(
        { id: existing.id, title: title.trim(), description: description || null, targetDate: targetDate || null },
        { onSuccess: onClose },
      );
    } else {
      createGoal.mutate(
        { title: title.trim(), description: description || undefined, targetDate: targetDate || undefined },
        { onSuccess: onClose },
      );
    }
  };

  const isPending = createGoal.isPending || updateGoal.isPending;

  return (
    <Modal open onClose={onClose} title={existing ? 'Edit Goal' : 'New Goal'}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Goal title"
          className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
          autoFocus
        />
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description (optional)"
          rows={3}
          className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50 resize-none"
        />
        <div>
          <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)] mb-1 block">Target date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!title.trim() || isPending}>
            {isPending ? <Loader2 className="size-5 animate-spin" /> : null}
            {existing ? 'Save' : 'Create'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Add Milestone Modal ── */
function MilestoneFormModal({
  goalId,
  onClose,
}: {
  goalId: string;
  onClose: () => void;
}) {
  const [title, setTitle] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const createMilestone = useCreateMilestone();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    createMilestone.mutate(
      { goalId, title: title.trim(), targetDate: targetDate || undefined },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open onClose={onClose} title="Add Milestone">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Milestone title"
          className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
          autoFocus
        />
        <div>
          <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)] mb-1 block">Target date</label>
          <input
            type="date"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
            className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!title.trim() || createMilestone.isPending}>
            {createMilestone.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
            Add
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Schedule Milestone Modal ── */
function ScheduleMilestoneModal({
  goalId,
  milestoneId,
  onClose,
}: {
  goalId: string;
  milestoneId: string;
  onClose: () => void;
}) {
  const [date, setDate] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const schedule = useScheduleMilestone();

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!date || !startTime || !endTime) return;
    schedule.mutate(
      { goalId, milestoneId, date, startTime, endTime },
      { onSuccess: onClose },
    );
  };

  return (
    <Modal open onClose={onClose} title="Schedule in Planner">
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)] mb-1 block">Date</label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)] mb-1 block">Start</label>
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
            />
          </div>
          <div>
            <label className="font-body text-[12px] font-semibold uppercase tracking-[0.04em] text-[var(--ink-500)] mb-1 block">End</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[15px] clay-inset focus:outline-none focus:ring-4 focus:ring-blue-50"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={!date || schedule.isPending}>
            {schedule.isPending ? <Loader2 className="size-5 animate-spin" /> : null}
            Schedule
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ── Page ── */
export function GoalsPage() {
  const { data: goals = [], isLoading, error } = useGoalsList();
  const deleteGoal = useDeleteGoal();
  const updateGoal = useUpdateGoal();
  const updateMilestone = useUpdateMilestone();
  const deleteMilestone = useDeleteMilestone();

  const [showCreateGoal, setShowCreateGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithMilestones | null>(null);
  const [addingMilestoneTo, setAddingMilestoneTo] = useState<string | null>(null);
  const [schedulingMilestone, setSchedulingMilestone] = useState<{ goalId: string; milestoneId: string } | null>(null);
  const [showArchived, setShowArchived] = useState(false);

  const visibleGoals = showArchived
    ? goals
    : goals.filter((g) => g.status !== 'archived');

  return (
    <div className="flex flex-col gap-6 pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[var(--ink-900)]">Goals</h1>
          <p className="font-body text-[15px] text-[var(--ink-500)] mt-1">
            Long-term targets and the milestones that get you there.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`inline-flex items-center gap-1.5 rounded-[--radius-md] px-3 py-2 font-body text-[13px] font-semibold clay-l1 hover:clay-l2 clay-transition ${
              showArchived ? 'bg-blue-50 text-blue-700' : 'bg-clay-surface text-[var(--ink-500)]'
            }`}
          >
            {showArchived ? 'Showing all' : 'Show archived'}
          </button>
          <Button onClick={() => setShowCreateGoal(true)}>
            <Target className="size-5" />
            New Goal
          </Button>
        </div>
      </div>

      {/* Loading */}
      {isLoading && (
        <div className="flex justify-center py-16 text-[var(--ink-300)]">
          <Loader2 className="size-8 animate-spin" />
        </div>
      )}

      {/* Error */}
      {error && (
        <Card>
          <p className="font-body text-[15px] text-semantic-red">Failed to load goals.</p>
        </Card>
      )}

      {/* Empty */}
      {!isLoading && !error && visibleGoals.length === 0 && (
        <EmptyState
          icon={<Target className="size-8" />}
          title={showArchived ? 'No archived goals' : 'No goals yet'}
          description="Set a long-term target to start tracking your progress."
          action={!showArchived ? <Button onClick={() => setShowCreateGoal(true)}>Create Goal</Button> : undefined}
        />
      )}

      {/* Goals */}
      {!isLoading && visibleGoals.length > 0 && (
        <div className="grid gap-4">
          {visibleGoals.map((goal) => (
            <GoalCard
              key={goal.id}
              goal={goal}
              onToggleComplete={(id) => updateGoal.mutate({ id, status: goal.status === 'completed' ? 'active' : 'completed' })}
              onAddMilestone={(goalId) => setAddingMilestoneTo(goalId)}
              onToggleMilestone={(goalId, milestoneId, completed) => updateMilestone.mutate({ goalId, milestoneId, isCompleted: completed })}
              onDeleteMilestone={(goalId, milestoneId) => deleteMilestone.mutate({ goalId, milestoneId })}
              onArchive={(id) => updateGoal.mutate({ id, status: 'archived' })}
              onEdit={setEditingGoal}
              onScheduleMilestone={(goalId, milestoneId) => setSchedulingMilestone({ goalId, milestoneId })}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateGoal && <GoalFormModal onClose={() => setShowCreateGoal(false)} />}
      {editingGoal && <GoalFormModal existing={editingGoal} onClose={() => setEditingGoal(null)} />}
      {addingMilestoneTo && <MilestoneFormModal goalId={addingMilestoneTo} onClose={() => setAddingMilestoneTo(null)} />}
      {schedulingMilestone && (
        <ScheduleMilestoneModal
          goalId={schedulingMilestone.goalId}
          milestoneId={schedulingMilestone.milestoneId}
          onClose={() => setSchedulingMilestone(null)}
        />
      )}
    </div>
  );
}
