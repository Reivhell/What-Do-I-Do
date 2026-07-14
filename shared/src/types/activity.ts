export interface ActivitySession {
  id: string;
  userId: string;
  activityName: string;
  category: string;
  startTime: string;
  endTime: string | null;
  durationMinutes: number | null;
  source: 'live' | 'manual';
  note: string | null;
  sourceEventId: string | null;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface StartActivityInput {
  activityName: string;
  category: string;
  sourceEventId?: string;
  note?: string;
}

export interface ManualLogInput {
  activityName: string;
  category: string;
  startTime: string;
  endTime: string;
  note?: string;
}

export interface UpdateActivityInput {
  activityName?: string;
  category?: string;
  durationMinutes?: number;
  note?: string | null;
}

export interface ActivityHistoryFilter {
  search?: string;
  category?: string;
  dateFrom?: string;
  dateTo?: string;
}
