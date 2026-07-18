import { Injectable, Inject } from '@nestjs/common';
import { DRIZZLE } from '../../common/database/drizzle.provider.js'
import type { DbInstance } from '../../drizzle/index.js'
import { schema } from '../../drizzle/index.js'
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';

export type WidgetConfigItem = {
  widgetType: 'current_activity' | 'planner_preview' | 'tasks_preview' | 'habit_streak' | 'money_summary' | 'weekly_chart' | 'insights' | 'notes' | 'quick_actions';
  visible: boolean;
  position: number;
  pinned: boolean;
};

export type LayoutPreset = {
  id: string;
  userId: string;
  name: string;
  isActive: boolean;
  widgetConfig: WidgetConfigItem[];
  createdAt: string;
  updatedAt: string;
};

const DEFAULT_USER_ID = 'default';
const DEFAULT_WIDGET_CONFIG: WidgetConfigItem[] = [
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

@Injectable()
export class WorkspaceService {
  constructor(
    @Inject(DRIZZLE) private db: DbInstance,
  ) {}

  async listPresets(userId = DEFAULT_USER_ID): Promise<LayoutPreset[]> {
    const presets = await this.db.query.layoutPresets.findMany({
      where: (presets, { eq }) => eq(presets.userId, userId),
      orderBy: (presets, { desc }) => [desc(presets.createdAt)],
    });
    return presets as LayoutPreset[];
  }

  async getActivePreset(userId = DEFAULT_USER_ID): Promise<LayoutPreset | null> {
    const preset = await this.db.query.layoutPresets.findFirst({
      where: (presets, { eq, and }) => and(eq(presets.userId, userId), eq(presets.isActive, true)),
    });
    return preset as LayoutPreset | null;
  }

  async createPreset(userId: string, data: { name: string; widgetConfig?: WidgetConfigItem[] }): Promise<LayoutPreset> {
    const [preset] = await this.db
      .insert(schema.layoutPresets)
      .values({
        id: randomUUID(),
        userId,
        name: data.name,
        isActive: false,
        widgetConfig: data.widgetConfig || DEFAULT_WIDGET_CONFIG,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return preset as LayoutPreset;
  }

  async updatePreset(id: string, userId: string, data: { name?: string; widgetConfig?: WidgetConfigItem[] }): Promise<LayoutPreset | null> {
    const updateData: Record<string, unknown> = { updatedAt: new Date().toISOString() };
    if (data.name !== undefined) updateData.name = data.name;
    if (data.widgetConfig !== undefined) updateData.widgetConfig = data.widgetConfig;

    const [preset] = await this.db
      .update(schema.layoutPresets)
      .set(updateData)
      .where(and(eq(schema.layoutPresets.id, id), eq(schema.layoutPresets.userId, userId)))
      .returning();

    return preset as LayoutPreset | null;
  }

  async deletePreset(id: string, userId: string): Promise<boolean> {
    const preset = await this.db.query.layoutPresets.findFirst({
      where: (presets, { eq, and }) => and(eq(presets.id, id), eq(presets.userId, userId)),
    });

    if (!preset) return false;

    const wasActive = preset.isActive;
    await this.db.delete(schema.layoutPresets).where(eq(schema.layoutPresets.id, id));

    if (wasActive) {
      const remaining = await this.listPresets(userId);
      if (remaining.length > 0) {
        await this.activatePreset(userId, remaining[0].id);
      }
    }

    return true;
  }

  async activatePreset(userId: string, presetId: string): Promise<LayoutPreset | null> {
    return this.db.transaction(async (tx) => {
      await tx
        .update(schema.layoutPresets)
        .set({ isActive: false, updatedAt: new Date().toISOString() })
        .where(and(eq(schema.layoutPresets.userId, userId), eq(schema.layoutPresets.isActive, true)));

      const [preset] = await tx
        .update(schema.layoutPresets)
        .set({ isActive: true, updatedAt: new Date().toISOString() })
        .where(and(eq(schema.layoutPresets.id, presetId), eq(schema.layoutPresets.userId, userId)))
        .returning();

      return preset as LayoutPreset | null;
    });
  }

  async resetDefault(userId = DEFAULT_USER_ID): Promise<LayoutPreset> {
    await this.db.delete(schema.layoutPresets).where(eq(schema.layoutPresets.userId, userId));
    const [preset] = await this.db
      .insert(schema.layoutPresets)
      .values({
        id: randomUUID(),
        userId,
        name: 'Default Layout',
        isActive: true,
        widgetConfig: DEFAULT_WIDGET_CONFIG,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      })
      .returning();

    return preset as LayoutPreset;
  }

  async getWidgetConfig(userId = DEFAULT_USER_ID): Promise<WidgetConfigItem[]> {
    const preset = await this.getActivePreset(userId);
    return preset?.widgetConfig || DEFAULT_WIDGET_CONFIG;
  }
}