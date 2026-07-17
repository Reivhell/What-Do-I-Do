"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const habits_service_1 = require("../../../../src/modules/habits/habits.service");
const drizzle_provider_1 = require("../../../../src/common/database/drizzle.provider");
const statistics_service_1 = require("../../../../src/modules/statistics/statistics.service");
const planner_service_1 = require("../../../../src/modules/planner/planner.service");
const achievements_gateway_1 = require("../../../../src/modules/achievements/achievements.gateway");
const drizzle_1 = require("../../../../src/drizzle");
jest.mock('crypto', () => ({
    randomUUID: jest.fn(() => '00000000-0000-0000-0000-000000000001'),
}));
function createMockDb() {
    const returningMock = jest.fn().mockResolvedValue([{ id: 'mock-id' }]);
    const executeMock = jest.fn().mockResolvedValue({ changes: 1 });
    const selectWhereMock = jest.fn().mockResolvedValue([]);
    const chain = {
        insert: jest.fn(() => ({
            values: jest.fn(() => ({
                returning: returningMock,
                onConflictDoUpdate: jest.fn(() => ({ returning: returningMock })),
                onConflictDoNothing: jest.fn(() => ({ execute: executeMock })),
            })),
        })),
        update: jest.fn(() => ({
            set: jest.fn(() => ({
                where: jest.fn(() => ({ returning: returningMock })),
            })),
        })),
        delete: jest.fn(() => ({
            where: jest.fn(() => ({ returning: returningMock })),
        })),
        select: jest.fn(() => ({
            from: jest.fn(() => ({
                where: selectWhereMock,
            })),
        })),
        query: {
            tasks: { findMany: jest.fn(), findFirst: jest.fn() },
            subtasks: { findMany: jest.fn(), findFirst: jest.fn() },
            habits: { findMany: jest.fn(), findFirst: jest.fn() },
            habitLogs: { findMany: jest.fn(), findFirst: jest.fn() },
            goals: { findMany: jest.fn(), findFirst: jest.fn() },
            milestones: { findMany: jest.fn(), findFirst: jest.fn() },
            plannerEvents: { findMany: jest.fn(), findFirst: jest.fn() },
            activitySessions: { findMany: jest.fn(), findFirst: jest.fn() },
            userProfiles: { findMany: jest.fn(), findFirst: jest.fn() },
            userPreferences: { findMany: jest.fn(), findFirst: jest.fn() },
            notificationSettings: { findMany: jest.fn(), findFirst: jest.fn() },
            categoryDefinitions: { findMany: jest.fn(), findFirst: jest.fn() },
            statisticsCache: { findMany: jest.fn(), findFirst: jest.fn() },
        },
        _returning: returningMock,
        _execute: executeMock,
        _selectWhere: selectWhereMock,
    };
    return chain;
}
describe('HabitsService', () => {
    let service;
    let db;
    let mockStatsService;
    let mockPlannerService;
    let mockAchievementsGateway;
    const userId = 'user-1';
    beforeAll(async () => {
        mockStatsService = { invalidate: jest.fn().mockResolvedValue(undefined) };
        mockPlannerService = { create: jest.fn().mockResolvedValue({ id: 'event-id' }) };
        mockAchievementsGateway = { onStreakUpdated: jest.fn().mockResolvedValue([]) };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                habits_service_1.HabitsService,
                { provide: drizzle_provider_1.DRIZZLE, useValue: createMockDb() },
                { provide: statistics_service_1.StatisticsService, useValue: mockStatsService },
                { provide: planner_service_1.PlannerService, useValue: mockPlannerService },
                { provide: achievements_gateway_1.AchievementsEventGateway, useValue: mockAchievementsGateway },
            ],
        }).compile();
        service = module.get(habits_service_1.HabitsService);
        db = module.get(drizzle_provider_1.DRIZZLE);
    });
    beforeEach(() => {
        jest.clearAllMocks();
        db._returning.mockResolvedValue([{ id: 'mock-id' }]);
        db._selectWhere.mockResolvedValue([]);
    });
    describe('create', () => {
        it('should insert a habit and invalidate statistics', async () => {
            const dto = {
                name: 'Morning Run',
                targetFrequency: 'daily',
                repeatRule: { freq: 'daily', interval: 1 },
            };
            const createdHabit = {
                id: 'mock-id',
                name: 'Morning Run',
                targetFrequency: 'daily',
                currentStreak: 0,
                bestStreak: 0,
                completionCount: 0,
                missedCount: 0,
                notes: null,
                linkedGoalId: null,
            };
            db._returning.mockResolvedValue([createdHabit]);
            const result = await service.create(userId, dto);
            expect(db.insert).toHaveBeenCalledWith(drizzle_1.schema.habits);
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'habit');
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
            expect(result.name).toBe('Morning Run');
            expect(result.targetFrequency).toBe('daily');
        });
    });
    describe('findAll', () => {
        it('should return all habits for a user', async () => {
            const habits = [
                { id: 'h1', name: 'Read', userId, currentStreak: 0, bestStreak: 0, completionCount: 0, missedCount: 0, notes: null, linkedGoalId: null },
                { id: 'h2', name: 'Meditate', userId, currentStreak: 0, bestStreak: 0, completionCount: 0, missedCount: 0, notes: null, linkedGoalId: null },
            ];
            db.query.habits.findMany.mockResolvedValue(habits);
            const result = await service.findAll(userId);
            expect(db.query.habits.findMany).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });
        it('should return empty array when no habits exist', async () => {
            db.query.habits.findMany.mockResolvedValue([]);
            const result = await service.findAll(userId);
            expect(result).toEqual([]);
        });
    });
    describe('logHabit', () => {
        const habitId = 'habit-1';
        const existingHabit = {
            id: habitId,
            name: 'Read',
            userId,
            currentStreak: 0,
            bestStreak: 0,
            completionCount: 0,
            missedCount: 0,
            notes: null,
            linkedGoalId: null,
        };
        it('should upsert a habit log and recompute streaks', async () => {
            db.query.habits.findFirst.mockResolvedValue(existingHabit);
            const newLog = { id: 'log-1', habitId, date: '2026-07-16', status: 'done', linkedEventId: null, linkedSessionId: null };
            db._returning.mockResolvedValue([newLog]);
            const allLogs = [
                { id: 'log-1', habitId, date: '2026-07-16', status: 'done' },
                { id: 'log-2', habitId, date: '2026-07-15', status: 'done' },
                { id: 'log-3', habitId, date: '2026-07-14', status: 'done' },
            ];
            db.query.habitLogs.findMany.mockResolvedValue(allLogs);
            const dto = { date: '2026-07-16', status: 'done' };
            const result = await service.logHabit(habitId, userId, dto);
            expect(db.insert).toHaveBeenCalledWith(drizzle_1.schema.habitLogs);
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'habit');
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
            expect(mockAchievementsGateway.onStreakUpdated).toHaveBeenCalledWith(userId, expect.any(Number), expect.any(Number));
            expect(result.date).toBe('2026-07-16');
            expect(result.status).toBe('done');
        });
        it('should throw NotFoundException if habit does not exist', async () => {
            db.query.habits.findFirst.mockResolvedValue(null);
            const dto = { date: '2026-07-16', status: 'done' };
            await expect(service.logHabit(habitId, userId, dto)).rejects.toThrow('Habit not found');
        });
    });
});
