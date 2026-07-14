import { useState, type FormEvent } from 'react';
import {
  CheckCircle2, Tag, Trash2, Plus, X, ChevronLeft, ChevronRight,
  AlertCircle, Calendar, Flag, PenSquare, Archive, MoreVertical,
} from 'lucide-react';
import { Card, Badge, Button, Input, Modal } from '../ui';
import { useUpdateTask, useDeleteTask, useArchiveTask, useCreateSubtask, useUpdateSubtask, useDeleteSubtask } from '../../api/tasks';
import type { Task, Subtask, TaskStatus, TaskPriority } from '../../types/tasks';
import { formatDate, formatDateLong } from '../../lib/dateUtils';

interface TaskDetailModalProps {
  task: Task | null;
  open: boolean;
  onClose: () => void;
  onSchedule: (task: Task) => void;
}

export function TaskDetailModal({ task, open, onClose, onSchedule }: TaskDetailModalProps) {
  const [activeTab, setActiveTab] = useState<'details' | 'subtasks'>('details');
  const [showAddSubtask, setShowAddSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');

  // Form state for details tab
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<TaskStatus>('inbox');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [tags, setTags] = useState('');
  const [notes, setNotes] = useState('');

  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const archiveTask = useArchiveTask();
  const createSubtask = useCreateSubtask(task?.id || '');
  const updateSubtask = useUpdateSubtask();
  const deleteSubtask = useDeleteSubtask();

  // Sync form with task when it changes
  const isFirstRender = task?.id && title !== task.title;

  if (task && (isFirstRender || !title)) {
    setTitle(task.title);
    setDescription(task.description || '');
    setStatus(task.status);
    setPriority(task.priority);
    setDueDate(task.dueDate || '');
    setTags(task.tags?.join(', ') || '');
    setNotes(task.notes || '');
  }

  const overdue = task?.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'completed';
  const today = task?.dueDate && new Date(task.dueDate).toDateString() === new Date().toDateString();

  const handleSave = () => {
    if (!task) return;
    updateTask.mutate({
      id: task.id,
      title,
      description,
      status,
      priority,
      dueDate: dueDate || undefined,
      tags: tags.split(',').map(t => t.trim()).filter(Boolean),
      notes,
    });
  };

  const handleSubtaskToggle = (subtask: Subtask) => {
    updateSubtask.mutate({ id: subtask.id, isCompleted: !subtask.isCompleted });
  };

  const handleDeleteSubtask = (subtaskId: string) => {
    deleteSubtask.mutate(subtaskId);
  };

  const handleAddSubtask = (e: FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !task) return;
    createSubtask.mutate({ title: newSubtaskTitle.trim() });
    setNewSubtaskTitle('');
    setShowAddSubtask(false);
  };

  if (!task) return null;

  return (
    <Modal open={open} onClose={onClose} title="Task Details">
      <div className="flex flex-col h-[70vh] max-h-[600px]">
        {/* Tab Bar */}
        <div className="flex border-b brd-clr-divider-soft mb-4">
          <button
            onClick={() => setActiveTab('details')}
            className={`flex-1 py-3 px-4 font-body text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'text-primary border-primary'
                : 'text-ink-400 border-transparent hover:text-ink-700'
            }`}
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('subtasks')}
            className={`flex-1 py-3 px-4 font-body text-[13px] font-semibold border-b-2 transition-colors ${
              activeTab === 'subtasks'
                ? 'text-primary border-primary'
                : 'text-ink-400 border-transparent hover:text-ink-700'
            }`}
          >
            Subtasks
            {task.subtasks && task.subtasks.length > 0 && (
              <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary rounded-[--radius-pill] text-[10px] font-medium">
                {task.subtasks.length}
              </span>
            )}
          </button>
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto pr-2 space-y-4">
          {/* Details Tab */}
          {activeTab === 'details' && (
            <div className="space-y-4">
              {/* Title */}
              <div>
                <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
                  Title
                </label>
                <input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full rounded-[--radius-md] bg-clay-surface-alt px-4 py-3 font-body text-[16px] text-ink-900 placeholder:text-ink-300 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  placeholder="Task title"
                />
              </div>

              {/* Status & Priority */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
                    Status
                  </label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as TaskStatus)}
                    className="w-full rounded-[--radius-md] bg-clay-surface-alt px-3 py-2.5 font-body text-[14px] text-ink-900 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="inbox">Inbox</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
                    Priority
                  </label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value as TaskPriority)}
                    className="w-full rounded-[--radius-md] bg-clay-surface-alt px-3 py-2.5 font-body text-[14px] text-ink-900 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              {/* Due Date */}
              <div>
                <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2 flex items-center gap-2">
                  Due Date
                  {task.dueDate && (
                    <span className={`font-body text-[12px] ${overdue ? 'text-danger' : today ? 'text-primary' : 'text-ink-500'}`}>
                      {formatDateLong(task.dueDate)}
                      {overdue && <AlertCircle className="size-3.5 inline ml-1" />}
                      {today && <span className="ml-1 px-1.5 py-0.5 bg-primary/10 text-primary rounded-[--radius-pill] text-[10px]">Today</span>}
                    </span>
                  )}
                </label>
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="w-full rounded-[--radius-md] bg-clay-surface-alt px-3 py-2.5 font-body text-[14px] text-ink-900 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
              </div>

              {/* Tags */}
              <div>
                <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
                  Tags
                </label>
                <Input
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="work, personal, urgent (comma separated)"
                  icon={<Tag className="size-4" />}
                />
              </div>

              {/* Description */}
              <div>
                <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Add a description..."
                  rows={4}
                  className="w-full rounded-[--radius-md] bg-clay-surface-alt px-3 py-2.5 font-body text-[14px] text-ink-900 placeholder:text-ink-300 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block font-body text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-500 mb-2">
                  Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Private notes..."
                  rows={3}
                  className="w-full rounded-[--radius-md] bg-clay-surface-alt px-3 py-2.5 font-body text-[14px] text-ink-900 placeholder:text-ink-300 clay-inset border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 resize-none"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2 border-t brd-clr-divider-soft">
                <Button variant="primary" size="md" className="flex-1" onClick={handleSave}>
                  Save Changes
                </Button>
                <Button variant="destructive" size="md" onClick={() => deleteTask.mutate(task.id)}>
                  Delete
                </Button>
              </div>
            </div>
          )}

          {/* Subtasks Tab */}
          {activeTab === 'subtasks' && (
            <div className="flex-1 overflow-y-auto space-y-2">
              {task.subtasks && task.subtasks.length > 0 ? (
                <div className="space-y-1.5">
                  {task.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2 p-2 rounded-[--radius-md] hover:bg-clay-surface-alt clay-transition">
                      <input
                        type="checkbox"
                        checked={subtask.isCompleted}
                        onChange={() => handleSubtaskToggle(subtask)}
                        className="size-4.5 accent-primary"
                      />
                      <span className={`flex-1 font-body text-[14px] ${subtask.isCompleted ? 'line-through text-ink-400' : 'text-ink-900'}`}>
                        {subtask.title}
                      </span>
                      <button
                        onClick={() => handleDeleteSubtask(subtask.id)}
                        className="tap-target flex-shrink-0 text-ink-300 hover:text-danger clay-transition"
                        aria-label="Delete subtask"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center text-ink-400">
                  <CheckCircle2 className="size-12 opacity-30 mb-3" />
                  <p className="font-body text-[14px]">No subtasks yet</p>
                  <p className="text-[12px] mt-1">Break down your task into smaller steps</p>
                </div>
              )}

              {/* Add Subtask Form */}
              <form onSubmit={handleAddSubtask} className="pt-2 border-t brd-clr-divider-soft">
                {showAddSubtask ? (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newSubtaskTitle}
                      onChange={(e) => setNewSubtaskTitle(e.target.value)}
                      placeholder="Add a subtask..."
                      autoFocus
                      className="flex-1 rounded-[--radius-md] bg-clay-surface-alt px-3 py-2.5 font-body text-[14px] text-ink-900 placeholder:text-ink-300 clay-inset border border-primary focus:outline-none"
                    />
                    <Button type="submit" size="sm" variant="primary">
                      <Plus className="size-4" />
                    </Button>
                    <Button type="button" size="sm" variant="ghost" onClick={() => setShowAddSubtask(false)}>
                      Cancel
                    </Button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowAddSubtask(true)}
                    className="w-full tap-target flex items-center justify-center gap-2 rounded-[--radius-md] p-2 text-ink-400 hover:text-ink-700 hover:bg-blue-50 clay-transition font-body text-[13px] font-medium"
                  >
                    <Plus className="size-4" />
                    Add subtask
                  </button>
                )}
              </form>
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}