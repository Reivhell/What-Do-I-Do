"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const habit_dto_1 = require("../../../../src/modules/habits/dto/habit.dto");
describe('CreateHabitDto', () => {
    it('should create with optional fields undefined', () => {
        const dto = new habit_dto_1.CreateHabitDto();
        expect(dto.notes).toBeUndefined();
        expect(dto.linkedGoalId).toBeUndefined();
    });
    it('should allow property assignment', () => {
        const dto = new habit_dto_1.CreateHabitDto();
        dto.name = 'Morning run';
        dto.targetFrequency = 'daily';
        dto.repeatRule = { freq: 'daily', interval: 1 };
        dto.notes = '30 minutes every morning';
        dto.linkedGoalId = 'goal-uuid-1';
        expect(dto.name).toBe('Morning run');
        expect(dto.targetFrequency).toBe('daily');
        expect(dto.repeatRule).toEqual({ freq: 'daily', interval: 1 });
        expect(dto.notes).toBe('30 minutes every morning');
        expect(dto.linkedGoalId).toBe('goal-uuid-1');
    });
});
