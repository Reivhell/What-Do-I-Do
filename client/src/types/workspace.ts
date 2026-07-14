// Client-specific types for Workspace (mirrors shared + UI extensions)
import type {
  LayoutPreset,
  WidgetConfigItem,
  WidgetType,
  CreatePresetInput,
  UpdatePresetInput,
  DEFAULT_WIDGET_CONFIG,
  WIDGET_TYPE_LABELS,
} from '@whatdo/shared';

export type {
  LayoutPreset,
  WidgetConfigItem,
  WidgetType,
  CreatePresetInput,
  UpdatePresetInput,
};

export { DEFAULT_WIDGET_CONFIG, WIDGET_TYPE_LABELS };

// UI helper types
export interface PresetCardProps {
  preset: LayoutPreset;
  isActive: boolean;
  onActivate: (id: string) => void;
  onEdit: (preset: LayoutPreset) => void;
  onDelete: (id: string) => void;
}

export interface WidgetConfigItemUI extends WidgetConfigItem {
  label: string;
  icon: string;
}

export const WIDGET_UI_CONFIG: WidgetConfigItemUI[] = [
  { widgetType: 'current_activity', visible: true, position: 0, pinned: false, label: 'Current Activity', icon: 'speed' },
  { widgetType: 'planner_preview', visible: true, position: 1, pinned: false, label: 'Planner Preview', icon: 'event' },
  { widgetType: 'tasks_preview', visible: true, position: 2, pinned: false, label: 'Tasks Preview', icon: 'assignment' },
  { widgetType: 'habit_streak', visible: true, position: 3, pinned: false, label: 'Habit Streak', icon: 'local_fire_department' },
  { widgetType: 'money_summary', visible: true, position: 4, pinned: false, label: 'Money Summary', icon: 'account_balance_wallet' },
  { widgetType: 'weekly_chart', visible: true, position: 5, pinned: false, label: 'Weekly Chart', icon: 'show_chart' },
  { widgetType: 'insights', visible: true, position: 6, pinned: false, label: 'Insights', icon: 'psychology' },
  { widgetType: 'notes', visible: true, position: 7, pinned: false, label: 'Notes', icon: 'note' },
  { widgetType: 'quick_actions', visible: true, position: 8, pinned: false, label: 'Quick Actions', icon: 'flash_on' },
];