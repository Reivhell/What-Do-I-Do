import { CreateTaskDto, UpdateTaskDto, BulkUpdateStatusDto, CreateSubtaskDto, TaskStatus } from '../../../../src/modules/tasks/dto/task.dto';

describe('CreateTaskDto', () => {
  it('should create with defaults', () => {
    const dto = new CreateTaskDto();
    expect(dto.title).toBe('');
    expect(dto.tags).toEqual([]);
  });

  it('should allow property assignment', () => {
    const dto = new CreateTaskDto();
    dto.title = 'Test task';
    dto.description = 'A description';
    dto.priority = 'high';
    dto.dueDate = '2026-08-01';
    dto.tags = ['work', 'urgent'];
    dto.notes = 'Some notes';

    expect(dto.title).toBe('Test task');
    expect(dto.description).toBe('A description');
    expect(dto.priority).toBe('high');
    expect(dto.dueDate).toBe('2026-08-01');
    expect(dto.tags).toEqual(['work', 'urgent']);
    expect(dto.notes).toBe('Some notes');
  });
});

describe('UpdateTaskDto', () => {
  it('should create with all optional fields undefined', () => {
    const dto = new UpdateTaskDto();
    expect(dto.title).toBeUndefined();
    expect(dto.description).toBeUndefined();
    expect(dto.status).toBeUndefined();
    expect(dto.priority).toBeUndefined();
    expect(dto.dueDate).toBeUndefined();
    expect(dto.tags).toBeUndefined();
    expect(dto.notes).toBeUndefined();
  });

  it('should allow property assignment', () => {
    const dto = new UpdateTaskDto();
    dto.title = 'Updated task';
    dto.status = TaskStatus.COMPLETED;

    expect(dto.title).toBe('Updated task');
    expect(dto.status).toBe('completed');
  });
});

describe('BulkUpdateStatusDto', () => {
  it('should create with defaults', () => {
    const dto = new BulkUpdateStatusDto();
    expect(dto.taskIds).toEqual([]);
    expect(dto.status).toBe(TaskStatus.INBOX);
  });

  it('should accept a list of task IDs', () => {
    const dto = new BulkUpdateStatusDto();
    dto.taskIds = ['id-1', 'id-2'];

    expect(dto.taskIds).toEqual(['id-1', 'id-2']);
    expect(dto.status).toBe(TaskStatus.INBOX);
  });
});

describe('CreateSubtaskDto', () => {
  it('should create with default empty title', () => {
    const dto = new CreateSubtaskDto();
    expect(dto.title).toBe('');
  });

  it('should allow property assignment', () => {
    const dto = new CreateSubtaskDto();
    dto.title = 'Subtask title';

    expect(dto.title).toBe('Subtask title');
  });
});
