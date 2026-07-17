import { CreateGoalDto } from '../../../../src/modules/goals/dto/goal.dto';

describe('CreateGoalDto', () => {
  it('should create with optional fields undefined', () => {
    const dto = new CreateGoalDto();
    expect(dto.title).toBeUndefined();
    expect(dto.description).toBeUndefined();
    expect(dto.targetDate).toBeUndefined();
  });

  it('should allow property assignment', () => {
    const dto = new CreateGoalDto();
    dto.title = 'Learn TypeScript';
    dto.description = 'Master advanced types';
    dto.targetDate = '2026-12-31';

    expect(dto.title).toBe('Learn TypeScript');
    expect(dto.description).toBe('Master advanced types');
    expect(dto.targetDate).toBe('2026-12-31');
  });
});
