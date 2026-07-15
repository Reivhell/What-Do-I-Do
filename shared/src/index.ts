// @whatdo/shared — Types & validators
export type {
  CreateCaptureInput,
  UpdateCaptureInput,
  ConvertCaptureInput,
  CaptureItem,
  CaptureStatus,
  CaptureSource,
  ConvertTargetType,
} from './types/inbox';
export type {
  ActivitySession,
  StartActivityInput,
  ManualLogInput,
  UpdateActivityInput,
  ActivityHistoryFilter,
} from './types/activity';
export type {
  Goal,
  Milestone,
  CreateGoalInput,
  UpdateGoalInput,
  CreateMilestoneInput,
  UpdateMilestoneInput,
  ScheduleMilestoneInput,
  LinkedItem,
} from './types/goals';
export type {
  Task,
  Subtask,
  TaskStatus,
  TaskPriority,
  TaskView,
  CreateTaskInput,
  UpdateTaskInput,
  CreateSubtaskInput,
  UpdateSubtaskInput,
  ScheduleTaskInput,
} from './types/tasks';
export type {
  Account,
  CreateAccountInput,
  UpdateAccountInput,
  Transaction,
  CreateTransactionInput,
  UpdateTransactionInput,
  Budget,
  CreateBudgetInput,
  UpdateBudgetInput,
  RecurringBill,
  CreateRecurringBillInput,
  UpdateRecurringBillInput,
  MoneySummary,
} from './types/money';
export type {
  OverviewStats,
  TimeStats,
  ActivityStats,
  ActivityStatEntry,
  MoneyStats,
  MoneyStatEntry,
  HabitStats,
  HabitEntry,
  GoalStats,
  GoalEntry,
} from './types/statistics';
export type {
  LifeLogAnnotation,
  TimelineItem,
  TimelineSourceType,
  DailySummary,
  TimelineFilter,
  CreateAnnotationInput,
  UpdateAnnotationInput,
} from './types/life-log';
export type {
  Habit,
  HabitLog,
  HabitFrequency,
  HabitLogStatus,
  RepeatRule,
  CreateHabitInput,
  UpdateHabitInput,
  LogHabitInput,
  HabitWithLogs,
} from './types/habits';
export type {
  Insight,
  InsightType,
  InsightSeverity,
  WeeklySummary,
} from './types/insights';
export type {
  LayoutPreset,
  WidgetConfigItem,
  WidgetType,
  CreatePresetInput,
  UpdatePresetInput,
} from './types/workspace';
export {
  DEFAULT_WIDGET_CONFIG,
  WIDGET_TYPE_LABELS,
} from './types/workspace';
export type {
  UserSettings,
  SettingsUpdate,
  ThemeMode,
  NotificationSettings,
  PrivacySettings,
  DisplaySettings,
} from './types/settings';