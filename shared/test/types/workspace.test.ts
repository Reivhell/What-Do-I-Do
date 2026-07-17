import { describe, it, expect } from 'vitest';
import type { WorkspaceLayout, WidgetConfigItem } from '../../src/types/workspace';
import { DEFAULT_WIDGET_CONFIG, WIDGET_TYPE_LABELS } from '../../src/types/workspace';

describe('Workspace types', () => {
  it('should create WorkspaceLayout', () => {
    const wl: WorkspaceLayout = {
      id: '1', userId: 'u1', name: 'Default',
      preset: 'focus', widgets: [],
      createdAt: '', updatedAt: '',
    };
    expect(wl.preset).toBe('focus');
  });

  it('should create WidgetConfigItem', () => {
    const w: WidgetConfigItem = {
      type: 'habits', position: 0, size: 'medium',
      config: {},
    };
    expect(w.type).toBe('habits');
  });

  it('should export DEFAULT_WIDGET_CONFIG', () => {
    expect(DEFAULT_WIDGET_CONFIG).toBeDefined();
    expect(typeof DEFAULT_WIDGET_CONFIG).toBe('object');
  });

  it('should export WIDGET_TYPE_LABELS', () => {
    expect(WIDGET_TYPE_LABELS).toBeDefined();
    expect(typeof WIDGET_TYPE_LABELS).toBe('object');
  });
});
