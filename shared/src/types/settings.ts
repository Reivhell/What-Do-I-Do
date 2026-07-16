export type CategoryDomain = 'activity' | 'task' | 'money';

export interface UserProfile {
  userId: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserPreferences {
  userId: string;
  theme: string;
  language: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  categoryTimeMapping: Record<string, string>;
  // Money-specific preferences
  budgetAlertEnabled: boolean;
  defaultBudgetPeriod: 'daily' | 'weekly' | 'monthly' | 'yearly';
  transactionCategories: Record<string, string>; // category name -> color
  createdAt: string;
  updatedAt: string;
}

export interface NotificationSettings {
  userId: string;
  plannerReminderEnabled: boolean;
  habitReminderEnabled: boolean;
  budgetAlertEnabled: boolean;
  goalReminderEnabled: boolean;
  achievementAlertEnabled: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryDefinition {
  id: string;
  userId: string;
  domain: CategoryDomain;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProfileInput {
  name?: string;
  email?: string;
  avatarUrl?: string | null;
  bio?: string | null;
}

export interface UpdatePreferencesInput {
  theme?: string;
  language?: string;
  currency?: string;
  timezone?: string;
  dateFormat?: string;
  timeFormat?: string;
  categoryTimeMapping?: Record<string, string>;
  // Money-specific preferences
  budgetAlertEnabled?: boolean;
  defaultBudgetPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  transactionCategories?: Record<string, string>;
}

export interface UpdateNotificationsInput {
  plannerReminderEnabled?: boolean;
  habitReminderEnabled?: boolean;
  budgetAlertEnabled?: boolean;
  goalReminderEnabled?: boolean;
  achievementAlertEnabled?: boolean;
}

export interface CreateCategoryInput {
  domain: CategoryDomain;
  name: string;
  color: string;
}

// ── Export/Import (17-offline-sync.md) ──

export interface ExportData {
  exportedAt: string; // ISO timestamp
  appVersion: string; // schema version for import validation
  data: Record<string, unknown[]>; // table_name → rows
}

export interface ImportResult {
  [table: string]: {
    imported: number;
    skipped: number;
  };
}

// ── PIN / App Lock ──
export interface PinSettings {
  enabled: boolean;
  autoLockMinutes: number;
}

export interface SetPinInput {
  pin: string;
  confirmPin: string;
}

export interface VerifyPinInput {
  pin: string;
}

export interface UpdatePinSettingsInput {
  enabled?: boolean;
  autoLockMinutes?: number;
}
