import { useState, type ReactNode } from 'react';
import {
  CheckCircle2, Flag, Calendar, Tag, MoreVertical, Archive, Trash2,
  PenSquare, CalendarDays, ChevronDown, ChevronRight, AlertCircle, X,
  Circle,
} from 'lucide-react';
import { Badge } from '../ui';
import { useUpdateTask, useDeleteTask, useArchiveTask, useUpdateSubtask } from '../../api/tasks';
import type { Task, Subtask, TaskStatus, TaskPriority } from '../../types/tasks';
import { formatDate, isOverdue, isToday } from '../../lib/dateUtils';

interface TaskRowProps {
  task: Task;
  onToggleSubtasks: (taskId: string) => void;
  showSubtasks: boolean;
  onTaskClick: (task: Task) => void;
  onSchedule: (task: Task) => void;
  bulkMode?: boolean;
  selected?: boolean;
  onToggleSelect?: (taskId: string) => void;
}

const PRIORITY_ORDER: TaskPriority[] = ['urgent', 'high', 'medium', 'low', 'none'];

const PRIORITY_CONFIG: Record<string, { label: string; class: string }> = {
  urgent: { label: 'Urgent', class: 'text-semantic-red bg-semantic-red/10' },
  high: { label: 'High', class: 'text-semantic-amber bg-semantic-amber/10' },
  medium: { label: 'Medium', class: 'text-blue-600 bg-blue-50' },
  low: { label: 'Low', class: 'text-ink-500 bg-clay-surface-alt' },
  none: { label: '', class: '' },
};

const STATUS_CONFIG: Record<string, { icon: ReactNode; class: string; next: TaskStatus }> = {
  inbox: { icon: <Circle className="size-5 text-ink-300 hover:text-blue-500" />, class: '', next: 'active' },
  active: { icon: <Circle className="size-5 text-blue-500 hover:text-semantic-green" />, class: '', next: 'completed' },
  completed: { icon: <CheckCircle2 className="size-5 text-semantic-green" />, class: 'opacity-60', next: 'active' },
  archived: { icon: <Archive className="size-5 text-ink-300" />, class: 'opacity-40', next: 'active' },
};

export function TaskRow({ task, onToggleSubtasks, showSubtasks, onTaskClick, onSchedule, bulkMode, selected, onToggleSelect }: TaskRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const archiveTask = useArchiveTask();
  const updateSubtask = useUpdateSubtask();

  const statusCfg = STATUS_CONFIG[task.status] ?? STATUS_CONFIG.inbox;
  const priority = PRIORITY_CONFIG[task.priority ?? 'none'];
  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const overdue = task.dueDate && isOverdue(task.dueDate);
  const dueToday = task.dueDate && isToday(task.dueDate);

  const handleStatusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (task.status === 'inbox') {
      updateTask.mutate({ id: task.id, status: 'active' });
    } else if (task.status === 'active') {
      updateTask.mutate({ id: task.id, status: 'completed' });
    } else {
      updateTask.mutate({ id: task.id, status: 'active' });
    }
  };

  const handleSubtaskToggle = (subtask: Subtask) => {
    updateSubtask.mutate({ id: subtask.id, isCompleted: !subtask.isCompleted });
  };

  return (
    <div className={`group relative rounded-[--radius-lg] bg-clay-surface clay-l1 p-4 transition-all duration-150 hover:clay-l2 ${statusCfg.class}`}>
      {/* Bulk select checkbox */}
      {bulkMode && onToggleSelect && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 z-10">
          <input
            type="checkbox"
            checked={!!selected}
            onChange={() => onToggleSelect(task.id)}
            className="size-4 rounded border-ink-300 text-blue-500"
          />
        </div>
      )}

      <div className="flex items-start gap-3">
        {/* Status toggle */}
        {!bulkMode && (
          <button onClick={handleStatusClick} className="shrink-0 mt-0.5 clay-transition">
            {statusCfg.icon}
          </button>
        )}

        {/* Content */}
        <div className="flex-1 min-w-0" onClick={() => !bulkMode && onTaskClick(task)}>
          <div className="flex items-center gap-2">
            <h3 className={`font-body text-[15px] font-medium ${task.status === 'completed' ? 'line-through text-ink-400' : 'text-ink-900'}`}>
              {task.title}
            </h3>
            {priority.label && (
              <span className={`rounded-[--radius-sm] px-2 py-0.5 font-body text-[11px] font-semibold ${priority.class}`}>
                {priority.label}
              </span>
            )}
          </div>

          {/* Meta row */}
          <div className="flex items-center gap-3 mt-1">
            {task.dueDate && (
              <span className={`inline-flex items-center gap-1 font-body text-[12px] ${
                overdue ? 'text-semantic-red' : dueToday ? 'text-semantic-amber' : 'text-ink-400'
              }`}>
                <Calendar className="size-3" />
                {formatDate(task.dueDate)}
              </span>
            )}
            {task.category && (
              <span className="inline-flex items-center gap-1 font-body text-[12px] text-ink-400">
                <Tag className="size-3" />
                {task.category}
              </span>
            )}
            {task.project && (
              <span className="inline-flex items-center gap-1 font-body text-[12px] text-ink-400">
                <Flag className="size-3" />
                {task.project}
              </span>
            )}
            {task.energyEstimate && (
              <span className="font-body text-[12px] text-ink-400">
                ⚡{task.energyEstimate}
              </span>
            )}
            {hasSubtasks && (
              <span className="font-body text-[12px] text-ink-400">
                {task.subtasks?.filter(s => s.isCompleted).length}/{task.subtasks?.length ?? 0}
              </span>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="relative shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
            className="flex size-8 items-center justify-center rounded-[--radius-sm] text-ink-400 opacity-0 group-hover:opacity-100 hover:bg-clay-surface-alt hover:text-ink-700 clay-transition"
          >
            <MoreVertical className="size-4" />
          </button>
          {showMenu && (
            <div className="absolute right-0 top-full z-20 mt-1 min-w-[160px] rounded-[--radius-md] bg-clay-surface clay-l2 p-1 shadow-lg" onClick={e => e.stopPropagation()}>
              <button onClick={() => { onSchedule(task); setShowMenu(false); }}
                className="flex w-full items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-ink-700 hover:bg-blue-50 hover:text-blue-600">
                <CalendarDays className="size-3.5" /> Schedule
              </button>
              <button onClick={() => { archiveTask.mutate(task.id); setShowMenu(false); }}
                className="flex w-full items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-ink-700 hover:bg-amber-50 hover:text-amber-600">
                <Archive className="size-3.5" /> Archive
              </button>
              <button onClick={() => { deleteTask.mutate(task.id); setShowMenu(false); }}
                className="flex w-full items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-semantic-red hover:bg-semantic-red/10">
                <Trash2 className="size-3.5" /> Delete
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Subtasks */}
      {hasSubtasks && showSubtasks && (
        <div className="mt-3 pl-8 space-y-1">
          {task.subtasks?.map((subtask: Subtask) => (
            <div key={subtask.id} className="flex items-center gap-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={subtask.isCompleted}
                  onChange={() => handleSubtaskToggle(subtask)}
                  className="size-3.5 rounded border-ink-300 text-blue-500"
                />
                <span className={`font-body text-[14px] ${subtask.isCompleted ? 'line-through text-ink-400' : 'text-ink-700'}`}>
                  {subtask.title}
                </span>
              </label>
            </div>
          ))}
        </div>
      )}

      {/* Expand subtasks */}
      {hasSubtasks && (
        <button
          onClick={() => onToggleSubtasks(task.id)}
          className="flex items-center justify-center w-full mt-2 rounded-full clay-l1 hover:clay-pressed clay-transition text-ink-500 hover:text-ink-700"
          aria-label={showSubtasks ? 'Collapse subtasks' : 'Expand subtasks'}
        >
          {showSubtasks ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      )}
    </div>
  );
}
