// Client-specific types for Tasks (mirrors shared types + UI extensions)
export type TaskStatus = 'inbox' | 'active' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high';
export type TaskView = 'inbox' | 'today' | 'upcoming' | 'completed';

export interface Task {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate?: string;        // YYYY-MM-DD
  tags: string[];
  notes?: string;
  linkedGoalId?: string;
  scheduledEventId?: string;
  createdAt: string;
  updatedAt: string;
  subtasks?: Subtask[];
}

export interface Subtask {
  id: string;
  taskId: string;
  title: string;
  isCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}

// Input types
export interface CreateTaskInput {
  title: string;
  description?: string;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  notes?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string;
  tags?: string[];
  notes?: string;
}

export interface ScheduleTaskInput {
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:MM (24h UTC)
  endTime: string;        // HH:MM (24h UTC)
  durationMinutes: number;
}

export interface CreateSubtaskInput {
  title: string;
}

export interface UpdateSubtaskInput {
  title?: string;
  isCompleted?: boolean;
}

// View filter helpers
export const TASK_VIEWS: { value: TaskView; label: string; icon: string }[] = [
  { value: 'inbox', label: 'Inbox', icon: 'inbox' },
  { value: 'today', label: 'Today', icon: 'today' },
  { value: 'upcoming', label: 'Upcoming', icon: 'event_upcoming' },
  { value: 'completed', label: 'Completed', icon: 'check_circle' },
];

export const PRIORITY_OPTIONS: { value: TaskPriority; label: string; color: string }[] = [
  { value: 'low', label: 'Low', color: 'clr-success' },
  { value: 'medium', label: 'Medium', color: 'clr-primary' },
  { value: 'high', label: 'High', color: 'clr-danger' },
];

export const STATUS_OPTIONS: { value: TaskStatus; label: string; color: string }[] = [
  { value: 'inbox', label: 'Inbox', color: 'clr-primary' },
  { value: 'active', label: 'Active', color: 'clr-secondary' },
  { value: 'completed', label: 'Completed', color: 'clr-success' },
  { value: 'archived', label: 'Archived', color: 'clr-text-secondary' },
];