// @whatdo/shared — Workspace types

export type WidgetType =
  | 'current_activity'
  | 'planner_preview'
  | 'tasks_preview'
  | 'habit_streak'
  | 'money_summary'
  | 'weekly_chart'
  | 'insights'
  | 'notes'
  | 'quick_actions';

export interface WidgetConfigItem {
  widgetType: WidgetType;
  visible: boolean;
  position: number;
  pinned: boolean;
}

export interface LayoutPreset {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  widgetConfig: WidgetConfigItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CreatePresetInput {
  name: string;
  widgetConfig?: WidgetConfigItem[];
}

export interface UpdatePresetInput {
  name?: string;
  widgetConfig?: WidgetConfigItem[];
}

export const DEFAULT_WIDGET_CONFIG: WidgetConfigItem[] = [
  { widgetType: 'current_activity', visible: true, position: 0, pinned: false },
  { widgetType: 'planner_preview', visible: true, position: 1, pinned: false },
  { widgetType: 'tasks_preview', visible: true, position: 2, pinned: false },
  { widgetType: 'habit_streak', visible: true, position: 3, pinned: false },
  { widgetType: 'money_summary', visible: true, position: 4, pinned: false },
  { widgetType: 'weekly_chart', visible: true, position: 5, pinned: false },
  { widgetType: 'insights', visible: true, position: 6, pinned: false },
  { widgetType: 'notes', visible: true, position: 7, pinned: false },
  { widgetType: 'quick_actions', visible: true, position: 8, pinned: false },
];

export const WIDGET_TYPE_LABELS: Record<WidgetType, string> = {
  current_activity: 'Current Activity',
  planner_preview: 'Planner Preview',
  tasks_preview: 'Tasks Preview',
  habit_streak: 'Habit Streak',
  money_summary: 'Money Summary',
  weekly_chart: 'Weekly Chart',
  insights: 'Insights',
  notes: 'Notes',
  quick_actions: 'Quick Actions',
};