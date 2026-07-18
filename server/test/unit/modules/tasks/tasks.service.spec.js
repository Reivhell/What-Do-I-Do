"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const tasks_service_1 = require("../../../../src/modules/tasks/tasks.service");
const drizzle_provider_1 = require("../../../../src/common/database/drizzle.provider");
const planner_service_1 = require("../../../../src/modules/planner/planner.service");
const statistics_service_1 = require("../../../../src/modules/statistics/statistics.service");
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
describe('TasksService', () => {
    let service;
    let db;
    let mockStatsService;
    let mockPlannerService;
    beforeAll(async () => {
        mockStatsService = { invalidate: jest.fn().mockResolvedValue(undefined) };
        mockPlannerService = { scheduleFromTask: jest.fn().mockResolvedValue({ id: 'event-id' }), create: jest.fn() };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                tasks_service_1.TasksService,
                { provide: drizzle_provider_1.DRIZZLE, useValue: createMockDb() },
                { provide: planner_service_1.PlannerService, useValue: mockPlannerService },
                { provide: statistics_service_1.StatisticsService, useValue: mockStatsService },
            ],
        }).compile();
        service = module.get(tasks_service_1.TasksService);
        db = module.get(drizzle_provider_1.DRIZZLE);
    });
    beforeEach(() => {
        jest.clearAllMocks();
        db._returning.mockResolvedValue([{ id: 'mock-id' }]);
        db._selectWhere.mockResolvedValue([]);
    });
    describe('create', () => {
        it('should insert a task and invalidate statistics', async () => {
            const userId = 'user-1';
            const data = { title: 'Test Task', priority: 'high', tags: ['work'] };
            const expectedTask = { id: 'mock-id', title: 'Test Task', priority: 'high', tags: ['work'], status: 'inbox' };
            db._returning.mockResolvedValue([expectedTask]);
            const result = await service.create(userId, data);
            expect(db.insert).toHaveBeenCalledWith(drizzle_1.schema.tasks);
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
            expect(result).toEqual(expectedTask);
        });
        it('should create a task with defaults', async () => {
            const userId = 'user-1';
            const data = { title: 'Minimal Task' };
            const expectedTask = { id: 'mock-id', title: 'Minimal Task', priority: 'medium', status: 'inbox' };
            db._returning.mockResolvedValue([expectedTask]);
            const result = await service.create(userId, data);
            expect(db.insert).toHaveBeenCalledWith(drizzle_1.schema.tasks);
            expect(result.priority).toBe('medium');
            expect(result.status).toBe('inbox');
        });
    });
    describe('list', () => {
        const userId = 'user-1';
        const tasks = [
            { id: '1', title: 'Task A', status: 'inbox', userId },
            { id: '2', title: 'Task B', status: 'active', userId },
        ];
        it('should return all non-archived tasks when no view given', async () => {
            db.query.tasks.findMany.mockResolvedValue(tasks);
            const result = await service.list(userId);
            expect(db.query.tasks.findMany).toHaveBeenCalled();
            expect(result).toEqual(tasks);
        });
        it('should filter by inbox status', async () => {
            const inboxTasks = tasks.filter((t) => t.status === 'inbox');
            db.query.tasks.findMany.mockResolvedValue(inboxTasks);
            const result = await service.list(userId, 'inbox');
            expect(result).toEqual(inboxTasks);
        });
        it('should return empty array when no tasks exist', async () => {
            db.query.tasks.findMany.mockResolvedValue([]);
            const result = await service.list(userId);
            expect(result).toEqual([]);
        });
    });
    describe('update', () => {
        it('should update task fields', async () => {
            const userId = 'user-1';
            const taskId = 'task-1';
            const data = { title: 'Updated', status: 'completed' };
            const updatedTask = { id: taskId, title: 'Updated', status: 'completed', userId };
            db._returning.mockResolvedValue([updatedTask]);
            const result = await service.update(taskId, userId, data);
            expect(db.update).toHaveBeenCalledWith(drizzle_1.schema.tasks);
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
            expect(result).toEqual(updatedTask);
        });
        it('should handle partial updates', async () => {
            const userId = 'user-1';
            const taskId = 'task-1';
            db._returning.mockResolvedValue([{ id: taskId, priority: 'high' }]);
            await service.update(taskId, userId, { priority: 'high' });
            expect(db.update).toHaveBeenCalledWith(drizzle_1.schema.tasks);
        });
    });
    describe('delete', () => {
        it('should delete a task', async () => {
            const userId = 'user-1';
            const taskId = 'task-1';
            const deletedTask = { id: taskId, userId };
            db._returning.mockResolvedValue([deletedTask]);
            const result = await service.delete(taskId, userId);
            expect(db.delete).toHaveBeenCalledWith(drizzle_1.schema.tasks);
            expect(mockStatsService.invalidate).toHaveBeenCalledWith(userId, 'overall');
            expect(result).toEqual(deletedTask);
        });
    });
});
