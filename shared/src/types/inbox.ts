export interface CreateCaptureInput {
  rawText: string;
  source?: 'manual' | 'voice' | 'share_intent';
  tags?: string[];
}

export interface UpdateCaptureInput {
  rawText?: string;
  tags?: string[];
  pinned?: boolean;
  status?: CaptureStatus;
}

export interface ConvertCaptureInput {
  targetType: 'task' | 'planner_event' | 'habit' | 'goal' | 'money_note';
  payload?: Record<string, unknown>;
}

export type CaptureStatus = 'unprocessed' | 'processed' | 'archived';
export type CaptureSource = 'manual' | 'voice' | 'share_intent';
export type ConvertTargetType = 'task' | 'planner_event' | 'habit' | 'goal' | 'money_note';

export interface CaptureItem {
  id: string;
  userId: string;
  rawText: string;
  capturedAt: string;
  source: CaptureSource;
  detectedDate: string | null;
  tags: string[];
  status: CaptureStatus;
  convertedToType: string | null;
  convertedToId: string | null;
  pinned: boolean;
  createdAt: string;
  updatedAt: string;
}
