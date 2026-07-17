"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const goal_dto_1 = require("../../../../src/modules/goals/dto/goal.dto");
describe('CreateGoalDto', () => {
    it('should create with optional fields undefined', () => {
        const dto = new goal_dto_1.CreateGoalDto();
        expect(dto.title).toBeUndefined();
        expect(dto.description).toBeUndefined();
        expect(dto.targetDate).toBeUndefined();
    });
    it('should allow property assignment', () => {
        const dto = new goal_dto_1.CreateGoalDto();
        dto.title = 'Learn TypeScript';
        dto.description = 'Master advanced types';
        dto.targetDate = '2026-12-31';
        expect(dto.title).toBe('Learn TypeScript');
        expect(dto.description).toBe('Master advanced types');
        expect(dto.targetDate).toBe('2026-12-31');
    });
});
