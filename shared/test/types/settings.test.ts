import { describe, it, expect } from 'vitest';
import type { UserSettings, ThemeMode, NotificationSettings } from '../../src/types/settings';

describe('Settings types', () => {
  it('should create UserSettings', () => {
    const s: UserSettings = {
      theme: 'system', language: 'en',
      timezone: 'UTC', weekStartDay: 1,
    };
    expect(s.theme).toBe('system');
  });

  it('should accept all theme modes', () => {
    const modes: ThemeMode[] = ['light', 'dark', 'system'];
    expect(modes).toHaveLength(3);
  });

  it('should create NotificationSettings', () => {
    const ns: NotificationSettings = {
      pushEnabled: true, emailDigest: 'daily',
      reminderTime: '09:00',
    };
    expect(ns.pushEnabled).toBe(true);
  });
});
