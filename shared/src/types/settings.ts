export type ThemeMode = 'light' | 'dark' | 'system';

export interface UserSettings {
  theme: ThemeMode;
  language: string;
  timezone: string;
  weekStartsOn: 0 | 1 | 6;
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  display: DisplaySettings;
}

export interface NotificationSettings {
  push: boolean;
  email: boolean;
  dailyDigest: boolean;
  reminderLeadMinutes: number;
}

export interface PrivacySettings {
  showStatsOnDashboard: boolean;
  shareActivity: boolean;
}

export interface DisplaySettings {
  sidebarCollapsed: boolean;
  density: 'comfortable' | 'compact';
  fontSize: 'sm' | 'md' | 'lg';
}

export type SettingsUpdate = Partial<UserSettings>;
