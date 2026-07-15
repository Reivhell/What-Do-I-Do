import { useState } from 'react';
import {
  CheckCircle2, Archive, MoreVertical, X, Calendar, Flag, Tag,
  AlertCircle, ChevronDown, ChevronRight, Plus, Trash2, Loader2,
  ListChecks, Inbox, Clock, CheckCheck, LayoutList,
} from 'lucide-react';
import { Card, Badge, Button, EmptyState } from '../ui';
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
    const dueDate = new Date(task.dueDate);
    const now = new Date();
    const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    if (dueDate > next7Days) return 'upcoming';
    return 'today';
  }
  return 'inbox';
}

const VIEW_CONFIG: { value: TaskView; label: string; icon: typeof ListChecks }[] = [
  { value: 'inbox', label: 'Inbox', icon: Inbox },
  { value: 'today', label: 'Today', icon: Clock },
  { value: 'upcoming', label: 'Upcoming', icon: Calendar },
  { value: 'completed', label: 'Completed', icon: CheckCheck },
  { value: 'all', label: 'All', icon: LayoutList },
];

export function TaskList({ view = 'inbox', onTaskClick, onViewChange }: TaskListProps) {
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [scheduleTaskId, setScheduleTaskId] = useState<string | null>(null);
  const [showSubtasks, setShowSubtasks] = useState<Set<string>>(new Set());
  const [bulkMode, setBulkMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data: tasks = [], isLoading, error } = useTasksList(view);
  const updateTask = useUpdateTask();
  const deleteTask = useDeleteTask();
  const archiveTask = useArchiveTask();
  const scheduleTask = useScheduleTask();
  const bulkUpdate = useBulkUpdateTaskStatus();

  // Filter by view
  const filteredTasks = tasks.filter(t => getViewForTask(t) === view);
  const completedCount = tasks.filter(t => t.status === 'completed').length;

  // Subtask toggle
  const toggleSubtasks = (taskId: string) => {
    setShowSubtasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  // Bulk select
  const toggleSelect = (taskId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId); else next.add(taskId);
      return next;
    });
  };

  const handleBulkComplete = () => {
    bulkUpdate.mutate({ ids: Array.from(selectedIds), status: 'completed' });
    setSelectedIds(new Set());
  };

  const handleSchedule = (task: Task) => {
    setScheduleTaskId(task.id);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* View tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {VIEW_CONFIG.map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => onViewChange?.(value)}
            className={`inline-flex items-center gap-1.5 rounded-[--radius-pill] px-3.5 py-1.5 font-body text-[13px] font-medium whitespace-nowrap transition-all ${
              view === value
                ? 'bg-blue-500 text-white shadow-sm'
                : 'bg-clay-surface text-ink-500 hover:bg-blue-50 hover:text-ink-900'
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* Quick add */}
      <TaskQuickAdd defaultView={view} />

      {/* Bulk actions */}
      {bulkMode && selectedIds.size > 0 && (
        <div className="flex items-center gap-3 rounded-[--radius-md] bg-blue-50 clay-inset px-4 py-2">
          <span className="font-body text-[13px] text-blue-700 font-medium">{selectedIds.size} selected</span>
          <button onClick={handleBulkComplete} className="rounded-[--radius-md] bg-blue-500 px-4 py-1.5 font-body text-[13px] font-semibold text-white">
            Complete All
          </button>
          <button onClick={() => { setSelectedIds(new Set()); setBulkMode(false); }} className="font-body text-[13px] text-ink-500 hover:text-ink-700">
            Cancel
          </button>
        </div>
      )}

      {/* Loading / Error / Empty states */}
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-8 animate-spin text-blue-400" />
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <p className="font-body text-[15px] text-semantic-red">Failed to load tasks. Please try again.</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <EmptyState
          icon={<ListChecks className="size-10 text-ink-300" />}
          title="No tasks here"
          description={view === 'completed' ? 'No completed tasks yet.' : `No ${view === 'inbox' ? 'unsorted' : view} tasks. Use Quick Input to add one.`}
        />
      ) : (
        <div className="flex flex-col gap-2">
          {bulkMode && (
            <div className="flex items-center gap-2 px-1">
              <button
                onClick={() => setSelectedIds(new Set(filteredTasks.map(t => t.id)))}
                className="font-body text-[12px] text-blue-600 hover:text-blue-700"
              >
                Select all
              </button>
            </div>
          )}
          {filteredTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              onToggleSubtasks={toggleSubtasks}
              showSubtasks={showSubtasks.has(task.id)}
              onTaskClick={(t) => { setSelectedTask(t); }}
              onSchedule={handleSchedule}
              bulkMode={bulkMode}
              selected={selectedIds.has(task.id)}
              onToggleSelect={toggleSelect}
            />
          ))}
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
