"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const goals_service_1 = require("../../../../src/modules/goals/goals.service");
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
describe('GoalsService', () => {
    let service;
    let db;
    let mockStatsService;
    let mockPlannerService;
    let mockAchievementsGateway;
    const userId = 'user-1';
    beforeAll(async () => {
        mockStatsService = { invalidate: jest.fn().mockResolvedValue(undefined) };
        mockPlannerService = { create: jest.fn().mockResolvedValue({ id: 'planner-event-id' }) };
        mockAchievementsGateway = { onGoalCompleted: jest.fn().mockResolvedValue([]) };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                goals_service_1.GoalsService,
                { provide: drizzle_provider_1.DRIZZLE, useValue: createMockDb() },
                { provide: statistics_service_1.StatisticsService, useValue: mockStatsService },
                { provide: planner_service_1.PlannerService, useValue: mockPlannerService },
                { provide: achievements_gateway_1.AchievementsEventGateway, useValue: mockAchievementsGateway },
            ],
        }).compile();
        service = module.get(goals_service_1.GoalsService);
        db = module.get(drizzle_provider_1.DRIZZLE);
    });
    beforeEach(() => {
        jest.clearAllMocks();
        db._returning.mockResolvedValue([{ id: 'mock-id' }]);
        db._selectWhere.mockResolvedValue([]);
    });
    describe('createGoal', () => {
        it('should insert a goal and invalidate statistics', async () => {
            const data = { title: 'Learn TypeScript', description: 'Master advanced types' };
            const createdGoal = {
                id: 'mock-id',
                title: 'Learn TypeScript',
                description: 'Master advanced types',
                status: 'active',
            };
            db._returning.mockResolvedValue([createdGoal]);
            const result = await service.createGoal(userId, data);
            expect(db.insert).toHaveBeenCalledWith(drizzle_1.schema.goals);
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'goal');
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
            expect(result.title).toBe('Learn TypeScript');
        });
        it('should create a goal without optional fields', async () => {
            const data = { title: 'Minimal Goal' };
            db._returning.mockResolvedValue([{ id: 'mock-id', title: 'Minimal Goal' }]);
            const result = await service.createGoal(userId, data);
            expect(result.title).toBe('Minimal Goal');
        });
    });
    describe('listGoals', () => {
        it('should return all goals for a user', async () => {
            const goals = [
                { id: 'g1', title: 'Goal A', userId, status: 'active' },
                { id: 'g2', title: 'Goal B', userId, status: 'active' },
            ];
            db.query.goals.findMany.mockResolvedValue(goals);
            const result = await service.listGoals(userId);
            expect(db.query.goals.findMany).toHaveBeenCalled();
            expect(result).toHaveLength(2);
        });
        it('should return empty array when no goals exist', async () => {
            db.query.goals.findMany.mockResolvedValue([]);
            const result = await service.listGoals(userId);
            expect(result).toEqual([]);
        });
    });
    describe('updateGoal', () => {
        const goalId = 'goal-1';
        const existingGoal = { id: goalId, title: 'Old Title', userId, status: 'active' };
        it('should update goal fields and invalidate statistics', async () => {
            db.query.goals.findFirst.mockResolvedValue(existingGoal);
            const updatedGoal = { ...existingGoal, title: 'New Title', status: 'completed' };
            db._returning.mockResolvedValue([updatedGoal]);
            const result = await service.updateGoal(userId, goalId, { title: 'New Title', status: 'completed' });
            expect(db.query.goals.findFirst).toHaveBeenCalled();
            expect(db.update).toHaveBeenCalledWith(drizzle_1.schema.goals);
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'goal');
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
            expect(result.title).toBe('New Title');
            expect(result.status).toBe('completed');
        });
        it('should throw NotFoundException if goal does not exist', async () => {
            db.query.goals.findFirst.mockResolvedValue(null);
            await expect(service.updateGoal(userId, 'nonexistent', { title: 'Nope' })).rejects.toThrow('Goal not found');
        });
    });
});
