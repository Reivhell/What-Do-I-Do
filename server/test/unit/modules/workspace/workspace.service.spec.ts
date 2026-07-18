import { Test } from '@nestjs/testing';
import { WorkspaceService } from '../../../../src/modules/workspace/workspace.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';
import { schema } from '../../../../src/drizzle';

jest.mock('crypto', () => ({
  randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));

function createMockDb() {
  const _returning = jest.fn().mockResolvedValue([{ id: 'mock-id' }]);
  const _execute = jest.fn().mockResolvedValue({ changes: 1 });

  const chain: any = {
    insert: jest.fn(() => ({
      values: jest.fn(() => ({ returning: _returning })),
    })),
    update: jest.fn(() => ({
      set: jest.fn(() => ({ where: jest.fn(() => ({ returning: _returning, execute: _execute })) })),
    })),
    delete: jest.fn(() => ({
      where: jest.fn(() => ({ returning: _returning, execute: _execute })),
    })),
    transaction: jest.fn((cb: (tx: any) => any) => {
      const tx = {
        update: jest.fn(() => ({ set: jest.fn(() => ({ where: jest.fn(() => ({ execute: jest.fn().mockResolvedValue({ changes: 1 }) })) })) })),
        query: { layoutPresets: { findFirst: jest.fn().mockResolvedValue(null) } },
      };
      return cb(tx);
    }),
    query: {
      layoutPresets: { findFirst: jest.fn().mockResolvedValue(null), findMany: jest.fn().mockResolvedValue([]) },
    },
    _returning, _execute,
  };
  return chain;
}

describe('WorkspaceService', () => {
  let service: WorkspaceService;
  let db: ReturnType<typeof createMockDb>;
  const uid = 'user-1';

  beforeEach(async () => {
    db = createMockDb();
    const module = await Test.createTestingModule({
      providers: [WorkspaceService, { provide: DRIZZLE, useValue: db }],
    }).compile();
    service = module.get(WorkspaceService);
  });

  describe('createPreset', () => {
    it('should create a layout preset', async () => {
      db._returning.mockResolvedValue([{ id: 'p1', name: 'My Layout', userId: uid, isActive: false }]);
      const r = await service.createPreset(uid, { name: 'My Layout' });
      expect(r.name).toBe('My Layout');
    });
  });

  describe('listPresets', () => {
    it('should return all presets', async () => {
      db.query.layoutPresets.findMany.mockResolvedValue([{ id: 'p1', name: 'A', userId: uid }, { id: 'p2', name: 'B', userId: uid }]);
      const r = await service.listPresets(uid);
      expect(r).toHaveLength(2);
    });

    it('should return empty when none exist', async () => {
      db.query.layoutPresets.findMany.mockResolvedValue([]);
      const r = await service.listPresets(uid);
      expect(r).toEqual([]);
    });
  });

  describe('getActivePreset', () => {
    it('should return active preset', async () => {
      db.query.layoutPresets.findFirst.mockResolvedValue({ id: 'p1', userId: uid, isActive: true });
      const r = await service.getActivePreset(uid);
      expect(r!.isActive).toBe(true);
    });

    it('should return null when none active', async () => {
      db.query.layoutPresets.findFirst.mockResolvedValue(null);
      const r = await service.getActivePreset(uid);
      expect(r).toBeNull();
    });
  });

  describe('updatePreset', () => {
    it('should update a preset', async () => {
      db.query.layoutPresets.findFirst = jest.fn().mockResolvedValue({ id: 'p1', userId: uid });
      db._returning.mockResolvedValue([{ id: 'p1', name: 'Renamed' }]);
      const r = await service.updatePreset('p1', uid, { name: 'Renamed' });
      expect(r!.name).toBe('Renamed');
    });
  });

  describe('deletePreset', () => {
    it('should delete a preset', async () => {
      db.query.layoutPresets.findFirst = jest.fn().mockResolvedValue({ id: 'p1', userId: uid });
      const r = await service.deletePreset('p1', uid);
      expect(r).toBe(true);
    });
  });

  describe('resetDefault', () => {
    it('should reset to default layout', async () => {
      db._returning.mockResolvedValue([{ id: 'd1', userId: uid, name: 'Default Layout', isActive: true }]);
      const r = await service.resetDefault(uid);
      expect(r.name).toBe('Default Layout');
    });
  });

  describe('getWidgetConfig', () => {
    it('should return config from active preset', async () => {
      const cfg = [{ widgetType: 'notes', visible: true, position: 0, pinned: false }];
      db.query.layoutPresets.findFirst.mockResolvedValue({ id: 'p1', userId: uid, widgetConfig: cfg });
      const r = await service.getWidgetConfig(uid);
      expect(r).toEqual(cfg);
    });

    it('should fallback to default config', async () => {
      db.query.layoutPresets.findFirst.mockResolvedValue(null);
      const r = await service.getWidgetConfig(uid);
      expect(r.length).toBeGreaterThan(0);
    });
  });
});
