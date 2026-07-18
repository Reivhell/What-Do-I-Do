import { Test } from '@nestjs/testing';
import { AchievementsService } from '../../../../src/modules/achievements/achievements.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const mockDefinitionRows = [
  {
    id: 'def-1',
    title: '5 Tasks',
    description: 'Complete 5 tasks',
    requirementType: 'tasks_completed',
    requirementValue: 5,
    icon: 'star',
    category: 'productivity',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'def-2',
    title: '10 Tasks',
    description: 'Complete 10 tasks',
    requirementType: 'tasks_completed',
    requirementValue: 10,
    icon: 'star',
    category: 'productivity',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
  {
    id: 'def-3',
    title: '5-Day Streak',
    description: 'Maintain a 5-day streak',
    requirementType: 'streak_days',
    requirementValue: 5,
    icon: 'fire',
    category: 'consistency',
    createdAt: '2024-01-01T00:00:00.000Z',
  },
];

function achievementRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'def-1',
    title: 'First Steps',
    description: 'Complete your first task',
    requirementType: 'tasks_completed',
    requirementValue: 1,
    icon: 'star',
    category: 'productivity',
    progress: 0,
    unlockedAt: null,
    userAchievementId: null,
    ...overrides,
  };
}

function createMockDb() {
  const chain = {
    select: jest.fn(() => chain),
    from: jest.fn(() => chain),
    leftJoin: jest.fn(() => chain),
    where: jest.fn(() => chain),
    orderBy: jest.fn(() => chain),
    limit: jest.fn(() => chain),
    then: jest.fn((resolve: (value: unknown) => void) => resolve([])),
    catch: jest.fn(),
    [Symbol.iterator]: function* () {},
  };

  const insertThenable = {
    then: jest.fn((resolve: (value?: unknown) => void) => resolve()),
    catch: jest.fn(),
  };

  return {
    select: jest.fn(() => chain),
    insert: jest.fn(() => ({
      values: jest.fn(() => ({
        onConflictDoUpdate: jest.fn(() => insertThenable),
      })),
    })),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

const mockDb = createMockDb();

describe('AchievementsService', () => {
  let service: AchievementsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [AchievementsService, { provide: DRIZZLE, useValue: mockDb }],
    }).compile();
    service = module.get(AchievementsService);
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  // -----------------------------------------------------------------------
  // findAll
  // -----------------------------------------------------------------------

  describe('findAll', () => {
    it('should return all achievements with progress for a user', async () => {
      const rows = [
        achievementRow({ progress: 1, unlockedAt: '2024-01-01T00:00:00.000Z', userAchievementId: 'ua-1' }),
        achievementRow({ id: 'def-2', title: 'Getting Things Done' }),
      ];
      mockDb.select().from().leftJoin().where().orderBy().then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(rows));

      const result = await service.findAll('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('def-1');
      expect(result[0].progress).toBe(1);
      expect(mockDb.select).toHaveBeenCalled();
    });

    it('should return empty array when no achievements exist', async () => {
      mockDb.select().from().leftJoin().where().orderBy().then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([]));

      const result = await service.findAll('user-1');

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // findUnlocked
  // -----------------------------------------------------------------------

  describe('findUnlocked', () => {
    it('should return only achievements with a non-null unlockedAt', async () => {
      const rows = [
        achievementRow({ progress: 1, unlockedAt: '2024-01-01T00:00:00.000Z', userAchievementId: 'ua-1' }),
        achievementRow({ id: 'def-2', progress: 0, unlockedAt: null }),
        achievementRow({ id: 'def-3', progress: 3, unlockedAt: '2024-02-01T00:00:00.000Z', userAchievementId: 'ua-2' }),
      ];
      mockDb.select().from().leftJoin().where().orderBy().then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(rows));

      const result = await service.findUnlocked('user-1');

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('def-1');
      expect(result[1].id).toBe('def-3');
    });

    it('should return empty array when no achievements are unlocked', async () => {
      const rows = [
        achievementRow({ progress: 0, unlockedAt: null }),
        achievementRow({ id: 'def-2', progress: 0, unlockedAt: null }),
      ];
      mockDb.select().from().leftJoin().where().orderBy().then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(rows));

      const result = await service.findUnlocked('user-1');

      expect(result).toEqual([]);
    });
  });

  // -----------------------------------------------------------------------
  // findOne
  // -----------------------------------------------------------------------

  describe('findOne', () => {
    it('should return the matching achievement by id', async () => {
      const rows = [
        achievementRow({ progress: 1, unlockedAt: '2024-01-01T00:00:00.000Z', userAchievementId: 'ua-1' }),
        achievementRow({ id: 'def-2', title: 'Getting Things Done' }),
      ];
      mockDb.select().from().leftJoin().where().orderBy().then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(rows));

      const result = await service.findOne('user-1', 'def-1');

      expect(result).not.toBeNull();
      expect(result!.id).toBe('def-1');
    });

    it('should return null when achievement id does not match any row', async () => {
      mockDb.select().from().leftJoin().where().orderBy().then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([]));

      const result = await service.findOne('user-1', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  // -----------------------------------------------------------------------
  // evaluate
  // -----------------------------------------------------------------------

  describe('evaluate', () => {
    /** Reset shared mock state between evaluate tests */
    beforeEach(() => {
      // Hard-reset chain.then so no stale mockImplementationOnce remain.
      const c = mockDb.select() as any;
      c.then.mockReset().mockImplementation((resolve: (value: unknown) => void) => resolve([]));
      // Same for insertThenable.
      const ins = mockDb.insert().values().onConflictDoUpdate() as any;
      ins.then.mockReset().mockImplementation((resolve: (value?: unknown) => void) => resolve());
      // Clear the calls we just made to select / insert so assertions are clean.
      (mockDb.select as jest.Mock).mockClear();
      (mockDb.insert as jest.Mock).mockClear();
    });

    it('should unlock achievements whose requirementValue is met', async () => {
      const chain = mockDb.select() as any;
      chain.then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(mockDefinitionRows.slice(0, 2)))
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([]))
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([]));

      const result = await service.evaluate('user-1', 'tasks_completed', 5);

      // def-1: requirementValue=5, progress=5 → unlocked
      // def-2: requirementValue=10, progress=5 → not unlocked
      expect(result).toEqual(['def-1']);
    });

    it('should accumulate progress for cumulative event types', async () => {
      const chain = mockDb.select() as any;
      chain.then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(mockDefinitionRows.slice(0, 1)))
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([
          { id: 'ua-1', userId: 'user-1', achievementId: 'def-1', progress: 3, unlockedAt: null },
        ]));

      await service.evaluate('user-1', 'tasks_completed', 4);

      // tasks_completed is cumulative → newProgress = 3 + 4 = 7
      const valuesArg = (mockDb.insert as jest.Mock).mock.results[0].value.values.mock.calls[0][0];
      expect(valuesArg.progress).toBe(7);
    });

    it('should take max progress for streak/kept event types', async () => {
      const chain = mockDb.select() as any;
      chain.then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(mockDefinitionRows.slice(2, 3)))
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([
          { id: 'ua-3', userId: 'user-1', achievementId: 'def-3', progress: 3, unlockedAt: null },
        ]));

      await service.evaluate('user-1', 'streak_days', 7);

      // streak_days uses max → newProgress = max(3, 7) = 7
      const valuesArg = (mockDb.insert as jest.Mock).mock.results[0].value.values.mock.calls[0][0];
      expect(valuesArg.progress).toBe(7);
    });

    it('should not count an achievement as newly unlocked when it was already unlocked', async () => {
      const chain = mockDb.select() as any;
      chain.then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve(mockDefinitionRows.slice(0, 1)))
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([
          {
            id: 'ua-1', userId: 'user-1', achievementId: 'def-1',
            progress: 10, unlockedAt: '2024-01-01T00:00:00.000Z',
          },
        ]));

      const result = await service.evaluate('user-1', 'tasks_completed', 5);

      // requirement met but already unlocked → not pushed
      expect(result).toEqual([]);
    });

    it('should return empty array when no definitions match the event type', async () => {
      const chain = mockDb.select() as any;
      chain.then
        .mockImplementationOnce((resolve: (v: unknown) => void) => resolve([]));

      const result = await service.evaluate('user-1', 'nonexistent_type', 1);

      expect(result).toEqual([]);
    });
  });
});
