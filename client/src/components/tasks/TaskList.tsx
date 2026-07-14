import { useState } from 'react';
import {
  CheckCircle2, Archive, MoreVertical, X, Calendar, Flag, Tag,
  AlertCircle, ChevronDown, ChevronRight, Plus, Trash2,
} from 'lucide-react';
import { Card, Badge, Button } from '../ui';
import { TaskRow } from './TaskRow';
import { TaskDetailModal } from './TaskDetailModal';
import { ScheduleTaskModal } from './ScheduleTaskModal';
import { TaskQuickAdd } from './TaskQuickAdd';
import { useTasksList, useUpdateTask, useDeleteTask, useArchiveTask, useBulkUpdateTaskStatus, useScheduleTask } from '../../api/tasks';
import type { Task, TaskStatus, TaskView } from '../../types/tasks';
import { formatDate, isToday, isOverdue } from '../../lib/dateUtils';

interface TaskListProps {
  view?: TaskView;
  onTaskClick?: (task: Task) => void;
  onViewChange?: (view: TaskView) => void;
}

function getViewForTask(task: Task): TaskView {
  if (task.status === 'completed') return 'completed';
  if (task.status === 'inbox') return 'inbox';
  if (task.dueDate) {
    const today = new Date().toISOString().split('T')[0];
    if (task.dueDate === today) return 'today';
    if (task.dueDate > today) return 'upcoming';
  }
  // Active tasks without due date default to inbox for view counting
  return 'inbox';
}

function getFilteredTaskIds(tasks: Task[], view: TaskView): string[] {
  return tasks
    .filter(t => t.status !== 'completed' || view === 'completed')
    .map(t => t.id);
}

export function TaskList({ view = 'inbox', onTaskClick, onViewChange }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [scheduleTaskId, setScheduleTaskId] = useState<string | null>(null);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set());

  const { data: tasks = [], isLoading, error } = useTasksList(view);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const archiveTask = useArchiveTask();
  const bulkUpdateStatus = useBulkUpdateTaskStatus();
  const scheduleTask = useScheduleTask();

  const handleTaskClick = (task: Task) => {
    onTaskClick?.(task);
  };

  const toggleExpanded = (taskId: string) => {
    setExpandedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleBulkComplete = (taskIds: string[]) => {
    bulkUpdateStatus.mutate({ taskIds, status: 'completed' });
  };

  const handleBulkArchive = (taskIds: string[]) => {
    bulkUpdateStatus.mutate({ taskIds, status: 'archived' });
  };

  const handleSchedule = (task: Task) => {
    setScheduleTaskId(task.id);
  };

  const filteredTasks = tasks.filter(t => {
    if (view === 'completed') return t.status === 'completed';
    return t.status !== 'completed' || view === 'inbox';
  });

  const taskIds = getFilteredTaskIds(tasks, view);

  return (
    <div className="flex flex-col gap-6">
      {/* Quick Add */}
      <TaskQuickAdd defaultView={view} onTaskCreated={() => {}} />

      {/* View switcher tabs — claymorphism */}
      <div className="flex items-center gap-1 rounded-[--radius-lg] bg-clay-surface-alt p-1 self-start">
        {([
          { value: 'inbox' as TaskView, label: 'Inbox' },
          { value: 'today' as TaskView, label: 'Today' },
          { value: 'upcoming' as TaskView, label: 'Upcoming' },
          { value: 'completed' as TaskView, label: 'Completed' },
        ]).map((tab) => (
          <button
            key={tab.value}
            onClick={() => onViewChange?.(tab.value)}
            className={`rounded-[--radius-md] px-5 py-2.5 font-body text-sm font-semibold clay-transition ${
              view === tab.value
                ? 'clay-pressed bg-clay-surface text-ink-900'
                : 'clay-l1 bg-clay-surface text-ink-500 hover:text-ink-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading / Error / Empty States */}
      {isLoading && (
        <div className="flex items-center justify-center py-16 text-ink-300">
          <div className="animate-spin rounded-full border-3 border-primary border-t-transparent size-8" />
        </div>
      )}

      {error && (
        <Card level={1} className="p-4 bg-danger/10 text-danger">
          Failed to load tasks. Please try again.
        </Card>
      )}

      {!isLoading && !error && filteredTasks.length === 0 && (
        <Card level={1} className="p-12 text-center">
          <div className="size-16 mx-auto mb-4 bg-clay-surface-alt rounded-full flex items-center justify-center text-ink-300">
            <svg className="size-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <h3 className="font-display text-lg font-semibold text-ink-700 mb-1">
            {view === 'inbox' ? 'Inbox is empty' : view === 'today' ? 'Nothing due today' : view === 'upcoming' ? 'No upcoming tasks' : 'No completed tasks'}
          </h3>
          <p className="font-body text-[14px] text-ink-500">
            {view === 'inbox' ? 'Add a task above to get started.' : 'Great job! Enjoy the free time.'}
          </p>
        </Card>
      )}

      {/* Task List */}
      {!isLoading && !error && filteredTasks.length > 0 && (
        <div className="flex flex-col gap-3">
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleSubtasks={toggleExpanded}
              onSchedule={handleSchedule}
              onEdit={handleTaskClick}
              showSubtasks={expandedTasks.has(task.id)}
            />
          ))}

          {/* Bulk Actions Footer */}
          {view !== 'completed' && taskIds.length > 0 && (
            <Card level={2} className="p-3 animate-in slide-in-from-bottom-2 duration-200">
              <div className="flex items-center justify-between">
                <span className="font-body text-[13px] text-ink-500">
                  {taskIds.length} task{taskIds.length !== 1 ? 's' : ''} selected
                </span>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" size="sm" onClick={() => handleBulkComplete(taskIds)}>
                    <CheckCircle2 className="size-3.5 mr-1.5" />
                    Complete All
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => handleBulkArchive(taskIds)}>
                    <Archive className="size-3.5 mr-1.5" />
                    Archive All
                  </Button>
                </div>
              </div>
            </Card>
          )}
        </div>
      )}

      {/* Task Detail Modal */}
      <TaskDetailModal
        task={selectedTask}
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        onSchedule={handleSchedule}
      />

      {/* Schedule Modal */}
      <ScheduleTaskModal
        task={tasks.find(t => t.id === scheduleTaskId) || { id: '', title: '' }}
        open={!!scheduleTaskId}
        onClose={() => setScheduleTaskId(null)}
      />
    </div>
  );
}