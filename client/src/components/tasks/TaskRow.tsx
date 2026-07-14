import { useState, type ReactNode } from 'react';
import {
  CheckCircle2,
  Flag,
  Calendar,
  Tag,
  MoreVertical,
  Archive,
  Trash2,
  PenSquare,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  X,
} from 'lucide-react';
import { Card, Badge } from '../ui';
import { useUpdateTask, useDeleteTask, useArchiveTask, useUpdateSubtask } from '../../api/tasks';
import type { Task, Subtask, TaskStatus, TaskPriority } from '../../types/tasks';
import { formatDate, isOverdue, isToday } from '../../lib/dateUtils';

interface TaskRowProps {
  task: Task;
  onToggleSubtasks: (taskId: string) => void;
  onSchedule: (task: Task) => void;
  onEdit: (task: Task) => void;
  showSubtasks?: boolean;
  isExpanded?: boolean;
}

const PRIORITY_ICONS: Record<TaskPriority, ReactNode> = {
  low: <Flag className="size-3.5 text-success" />,
  medium: <Flag className="size-3.5 text-primary" />,
  high: <Flag className="size-3.5 text-danger" fill="currentColor" />,
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

const STATUS_LABELS: Record<TaskStatus, string> = {
  inbox: 'Inbox',
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

export function TaskRow({
  task,
  onToggleSubtasks,
  onSchedule,
  onEdit,
  showSubtasks = false,
  isExpanded = false,
}: TaskRowProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const archiveTask = useArchiveTask();
  const updateSubtask = useUpdateSubtask();

  const hasSubtasks = task.subtasks && task.subtasks.length > 0;
  const completedSubtasks = task.subtasks?.filter((s) => s.isCompleted).length || 0;
  const totalSubtasks = task.subtasks?.length || 0;
  const overdue = task.dueDate && isOverdue(task.dueDate) && task.status !== 'completed';
  const today = task.dueDate && isToday(task.dueDate);

  const handleStatusChange = (newStatus: TaskStatus) => {
    updateTask.mutate({ id: task.id, status: newStatus });
  };

  const handleArchive = () => {
    archiveTask.mutate(task.id);
    setShowMenu(false);
  };

  const handleDelete = () => {
    if (confirm('Delete this task?')) {
      deleteTask.mutate(task.id);
    }
    setShowMenu(false);
  };

  const handleToggleSubtask = (subtask: Subtask) => {
    updateSubtask.mutate({ id: subtask.id, isCompleted: !subtask.isCompleted });
  };

  return (
    <div className="group">
      {/* Main Task Row */}
      <Card level={1} className={`clay-transition relative overflow-hidden ${task.status === 'completed' ? 'opacity-60' : ''}`}>
        <div className="flex items-start gap-4">
          {/* Checkbox / Status */}
          <div className="flex-shrink-0 mt-1">
            {task.status === 'completed' ? (
              <CheckCircle2 className="size-6 text-success shrink-0" style={{ fontVariationSettings: "'FILL' 1" }} />
            ) : (
              <button
                onClick={() => handleStatusChange(task.status === 'inbox' ? 'active' : 'completed')}
                className="tap-target rounded-full border-2 border-ink-200 hover:border-primary hover:bg-blue-50 clay-transition"
                aria-label={task.status === 'inbox' ? 'Mark as active' : 'Mark as completed'}
              >
                <span className="size-5 rounded-full border-2 border-ink-300 flex items-center justify-center" />
              </button>
            )}
          </div>

          {/* Task Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0 flex items-baseline gap-2 flex-wrap">
                <h3 className={`font-body text-[15px] leading-snug break-words ${task.status === 'completed' ? 'line-through text-ink-400' : 'text-ink-900'}`}>
                  {task.title}
                </h3>

                {/* Priority Badge */}
                <Badge variant={task.priority === 'high' ? 'danger' : task.priority === 'medium' ? 'warning' : 'default'}>
                  {PRIORITY_ICONS[task.priority]}
                  <span className="ml-1 font-body text-[11px] font-medium">{PRIORITY_LABELS[task.priority]}</span>
                </Badge>

                {/* Status Badge (only for non-inbox) */}
                {task.status !== 'inbox' && (
                  <Badge variant="default" className="text-[11px] border brd-clr-divider-soft">
                    {STATUS_LABELS[task.status]}
                  </Badge>
                )}

                {/* Scheduled indicator */}
                {task.scheduledEventId && (
                  <Badge variant="default" className="text-[11px] border brd-clr-divider-soft bg-blue-50 text-blue-700">
                    <CalendarDays className="size-3 mr-1" />
                    Scheduled
                  </Badge>
                )}
              </div>

              {/* Menu */}
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                  className="tap-target flex-shrink-0 rounded-[--radius-md] p-1.5 text-ink-300 hover:bg-blue-50 hover:text-blue-600 clay-transition"
                  aria-label="More options"
                >
                  <MoreVertical className="size-4" />
                </button>

                {showMenu && (
                  <div className="absolute right-0 top-full mt-1.5 z-20 clay-card p-1.5 clay-l2 rounded-[--radius-md] shadow-lg min-w-[160px] animate-in fade-in-0 zoom-in-95 duration-150">
                    <button
                      onClick={() => { onEdit(task); setShowMenu(false); }}
                      className="w-full tap-target flex items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-ink-700 hover:bg-blue-50 clay-transition"
                    >
                      <PenSquare className="size-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => { onSchedule(task); setShowMenu(false); }}
                      className="w-full tap-target flex items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-ink-700 hover:bg-blue-50 clay-transition"
                    >
                      <Calendar className="size-4" />
                      Schedule
                    </button>
                    <button
                      onClick={handleArchive}
                      className="w-full tap-target flex items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-ink-700 hover:bg-amber-50 clay-transition"
                    >
                      <Archive className="size-4" />
                      Archive
                    </button>
                    <button
                      onClick={handleDelete}
                      className="w-full tap-target flex items-center gap-2 rounded-[--radius-sm] px-3 py-2 font-body text-[13px] text-semantic-red hover:bg-red-50 clay-transition"
                    >
                      <Trash2 className="size-4" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Description */}
            {task.description && (
              <p className="mt-1.5 font-body text-[13px] text-ink-500 line-clamp-2">{task.description}</p>
            )}

            {/* Meta row: due date, tags, subtasks progress */}
            <div className="mt-2 flex flex-wrap items-center gap-2 text-[12px]">
              {task.dueDate && (
                <span className={`flex items-center gap-1 font-medium ${overdue ? 'text-danger' : today ? 'text-primary' : 'text-ink-400'}`}>
                  <Calendar className="size-3.5" />
                  {formatDate(task.dueDate)}
                  {overdue && <AlertCircle className="size-3.5" />}
                  {today && <span className="text-[10px] px-1.5 py-0.5 bg-primary/10 text-primary rounded-[--radius-pill]">Today</span>}
                </span>
              )}

              {task.tags.length > 0 && (
                <span className="flex items-center gap-1 text-ink-400">
                  <Tag className="size-3.5" />
                  {task.tags.slice(0, 3).map((t) => (
                    <span key={t} className="px-1.5 py-0.5 bg-ink-50 text-ink-600 rounded-[--radius-sm] font-medium">
                      {t}
                    </span>
                  ))}
                  {task.tags.length > 3 && <span className="text-ink-400">+{task.tags.length - 3}</span>}
                </span>
              )}

              {hasSubtasks && (
                <span className="flex items-center gap-1 text-ink-400">
                  <CheckCircle2 className="size-3.5" style={{ fontVariationSettings: "'FILL' 0.5" }} />
                  {completedSubtasks}/{totalSubtasks}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Expandable Subtasks */}
        {hasSubtasks && showSubtasks && (
          <div className="mt-3 animate-in slide-in-from-top-2 duration-200 border-t brd-clr-divider-soft pt-3">
            <div className="flex items-center gap-2 text-[12px] font-medium text-ink-500 mb-2">
              <span>Subtasks</span>
              <span className="px-2 py-0.5 bg-clay-surface-alt rounded-[--radius-pill]">{completedSubtasks}/{totalSubtasks}</span>
            </div>
            <div className="space-y-1.5 ml-6">
              {task.subtasks?.map((subtask) => (
                <label key={subtask.id} className="flex items-center gap-2 tap-target cursor-pointer group">
                  <input
                    type="checkbox"
                    checked={subtask.isCompleted}
                    onChange={() => handleToggleSubtask(subtask)}
                    className="size-4 accent-primary"
                  />
                  <span className={`font-body text-[13px] ${subtask.isCompleted ? 'line-through text-ink-400' : 'text-ink-700'}`}>
                    {subtask.title}
                  </span>
                </label>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Expand/Collapse Chevron for subtasks */}
      {hasSubtasks && (
        <button
          onClick={() => onToggleSubtasks(task.id)}
          className="flex items-center justify-center w-full mt-2 text-ink-400 hover:text-ink-600 clay-transition"
          aria-label={showSubtasks ? 'Collapse subtasks' : 'Expand subtasks'}
        >
          {showSubtasks ? (
            <ChevronDown className="size-5" />
          ) : (
            <ChevronRight className="size-5" />
          )}
        </button>
      )}
    </div>
  );
}