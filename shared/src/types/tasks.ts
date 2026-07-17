// @whatdo/shared — Tasks types

export type TaskStatus = 'inbox' | 'active' | 'completed' | 'archived';
export type TaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'none';
export type TaskView = 'inbox' | 'today' | 'upcoming' | 'completed' | 'all';

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

export interface CreateSubtaskInput {
  title: string;
}

export interface UpdateSubtaskInput {
  title?: string;
  isCompleted?: boolean;
}

export interface ScheduleTaskInput {
  date: string;           // YYYY-MM-DD
  startTime: string;      // HH:MM (24h UTC)
  endTime: string;        // HH:MM (24h UTC)
  durationMinutes: number;
}