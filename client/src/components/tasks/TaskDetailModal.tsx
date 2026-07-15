import { useState, type FormEvent } from 'react';
import {
  CheckCircle2, Tag, Trash2, Plus, X, ChevronLeft, ChevronRight,
  AlertCircle, Calendar, Flag, PenSquare, Archive, MoreVertical,
  Circle, Loader2,
} from 'lucide-react';
import { Badge, Input, Modal } from '../ui';
import { useUpdateTask, useDeleteTask, useArchiveTask, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '../../api/tasks';
import type { Task, Subtask, TaskStatus, TaskPriority } from '../../types/tasks';
import { formatDate, formatDateLong } from '../../lib/dateUtils';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSchedule: (task: Task) => void;
}

const PRIORITIES: { value: TaskPriority; label: string }[] = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
];

const STATUSES: { value: TaskStatus; label: string }[] = [
  { value: 'inbox', label: 'Inbox' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
];

export function TaskDetailModal({ task, open, onClose, onSchedule }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks'>('details');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('inbox');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [isDirty, setIsDirty] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const archiveTask = useArchiveTask();
  const createSubtask = useCreateSubtask(task?.id ?? '');
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();

  // Initialize form when task changes
  useState(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description || '');
      setStatus(task.status);
      setPriority(task.priority ?? 'medium');
      setDueDate(task.dueDate || '');
      setIsDirty(false);
    }
  });

  const handleSave = () => {
    if (!task || !isDirty) return;
    updateTask.mutate({
      id: task.id,
      title: title.trim() || task.title,
      description: description.trim() || undefined,
      status,
      priority,
      dueDate: dueDate || undefined,
    });
    setIsDirty(false);
  };

  const handleDelete = () => {
    if (!task) return;
    deleteTask.mutate(task.id);
    onClose();
  };

  const handleAddSubtask = (e: FormEvent) => {
    e.preventDefault();
    if (!task || !newSubtaskTitle.trim()) return;
    createSubtask.mutate({ title: newSubtaskTitle.trim() });
    setNewSubtaskTitle('');
    setShowAddSubtask(false);
  };

  if (!task) return null;

  const tabClass = (tab: string) =>
    `rounded-[--radius-pill] px-3.5 py-1.5 font-body text-[13px] font-medium transition-all ${
      activeTab === tab ? 'bg-blue-500 text-white' : 'bg-clay-surface text-ink-500 hover:bg-blue-50 hover:text-ink-900'
    }`;

  return (
    <Modal open={open} onClose={onClose} title={task.title}>
      {/* Tab bar */}
      <div className="flex gap-1 mb-5">
        <button onClick={() => setActiveTab('details')} className={tabClass('details')}>Details</button>
        <button onClick={() => setActiveTab('subtasks')} className={tabClass('subtasks')}>
          Subtasks ({task.subtasks?.length ?? 0})
        </button>
      </div>

      {activeTab === 'details' && (
        <div className="flex flex-col gap-4">
          {/* Title */}
          <div>
            <label className="mb-1 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Title</label>
            <input
              value={title}
              onChange={(e) => { setTitle(e.target.value); setIsDirty(true); }}
              className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900"
            />
          </div>

          {/* Description */}
          <div>
            <label className="mb-1 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Description</label>
            <textarea
              value={description}
              onChange={(e) => { setDescription(e.target.value); setIsDirty(true); }}
              rows={3}
              className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900 resize-none"
            />
          </div>

          {/* Status + Priority row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Status</label>
              <select
                value={status}
                onChange={(e) => { setStatus(e.target.value as TaskStatus); setIsDirty(true); }}
                className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900"
              >
                {STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Priority</label>
              <select
                value={priority}
                onChange={(e) => { setPriority(e.target.value as TaskPriority); setIsDirty(true); }}
                className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900"
              >
                {PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}
              </select>
            </div>
          </div>

          {/* Due date */}
          <div>
            <label className="mb-1 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Due Date</label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => { setDueDate(e.target.value); setIsDirty(true); }}
              className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900"
            />
          </div>

          {/* Category + Project */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Category</label>
              <input
                value={category}
                onChange={(e) => { setCategory(e.target.value); setIsDirty(true); }}
                placeholder="Work, Personal…"
                className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-400"
              />
            </div>
            <div>
              <label className="mb-1 block font-body text-[13px] font-semibold text-ink-500 uppercase tracking-[0.03em]">Project</label>
              <input
                value={project}
                onChange={(e) => { setProject(e.target.value); setIsDirty(true); }}
                placeholder="Project name"
                className="w-full rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3 font-body text-[15px] text-ink-900 placeholder:text-ink-400"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between pt-4 border-t border-ink-200/20">
            <div className="flex gap-2">
              {showDeleteConfirm ? (
                <div className="flex items-center gap-2">
                  <span className="font-body text-[13px] text-semantic-red">Delete?</span>
                  <button onClick={handleDelete} className="rounded-[--radius-md] bg-semantic-red px-4 py-2 font-body text-[13px] font-semibold text-white">
                    Yes
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} className="rounded-[--radius-md] bg-clay-surface px-4 py-2 font-body text-[13px] font-semibold text-ink-900 clay-l1">
                    No
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="inline-flex items-center gap-2 rounded-[--radius-md] bg-clay-surface px-4 py-2 font-body text-[13px] font-medium text-semantic-red clay-l1 hover:clay-l2"
                >
                  <Trash2 className="size-3.5" /> Delete
                </button>
              )}
            </div>
            <div className="flex gap-2">
              <button onClick={onClose} className="rounded-[--radius-md] bg-clay-surface px-5 py-2 font-body text-[13px] font-semibold text-ink-900 clay-l1 hover:clay-l2">
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={!isDirty}
                className="rounded-[--radius-md] bg-blue-500 px-5 py-2 font-body text-[13px] font-semibold text-white clay-l1 hover:clay-l2 disabled:opacity-40"
              >
                {updateTask.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'subtasks' && (
        <div className="flex flex-col gap-3">
          {/* Subtask list */}
          {task.subtasks && task.subtasks.length > 0 ? (
            task.subtasks.map((subtask: Subtask) => (
              <div key={subtask.id} className="flex items-center gap-3 rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-3">
                <label className="flex items-center gap-3 flex-1 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={subtask.completed}
                    onChange={() => updateSubtask.mutate({ id: subtask.id, isCompleted: !subtask.isCompleted })}
                    className="size-4 rounded border-ink-300 text-blue-500"
                  />
                  <span className={`font-body text-[14px] ${subtask.isCompleted ? 'line-through text-ink-400' : 'text-ink-700'}`}>
                    {subtask.title}
                  </span>
                </label>
                <button
                  onClick={() => deleteSubtask.mutate(subtask.id)}
                  className="flex size-7 items-center justify-center rounded-[--radius-sm] text-ink-400 hover:bg-semantic-red/10 hover:text-semantic-red"
                >
                  <X className="size-3.5" />
                </button>
              </div>
            ))
          ) : (
            <p className="font-body text-[14px] text-ink-400 text-center py-6">No subtasks yet.</p>
          )}

          {/* Add subtask form */}
          {showAddSubtask ? (
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2">
              <input
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Subtask title…"
                className="flex-1 rounded-[--radius-md] bg-clay-surface-alt clay-inset px-4 py-2.5 font-body text-[14px] text-ink-900 placeholder:text-ink-400"
                autoFocus
              />
              <button type="submit" disabled={!newSubtaskTitle.trim() || createSubtask.isPending}
                className="rounded-[--radius-md] bg-blue-500 px-4 py-2.5 font-body text-[13px] font-semibold text-white disabled:opacity-40">
                {createSubtask.isPending ? <Loader2 className="size-4 animate-spin" /> : 'Add'}
              </button>
              <button type="button" onClick={() => setShowAddSubtask(false)}
                className="rounded-[--radius-md] bg-clay-surface px-4 py-2.5 font-body text-[13px] font-semibold text-ink-900 clay-l1">
                Cancel
              </button>
            </form>
          ) : (
            <button onClick={() => setShowAddSubtask(true)}
              className="flex w-full items-center justify-center gap-2 rounded-[--radius-md] bg-clay-surface clay-l1 p-3 font-body text-[13px] font-medium text-ink-500 hover:clay-l2 hover:text-ink-700 clay-transition">
              <Plus className="size-4" /> Add subtask
            </button>
          )}
        </div>
      )}
    </Modal>
  );
}
