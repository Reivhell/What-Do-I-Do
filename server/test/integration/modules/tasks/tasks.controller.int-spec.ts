import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { TasksController } from '../../../../src/modules/tasks/tasks.controller';
import { TasksService } from '../../../../src/modules/tasks/tasks.service';

const mockTasksService = {
  list: jest.fn().mockResolvedValue([]),
  create: jest.fn(),
  update: jest.fn(),
};

describe('TasksController (integration)', () => {
  let app: INestApplication;
  let service: typeof mockTasksService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [TasksController],
      providers: [{ provide: TasksService, useValue: mockTasksService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get(TasksService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /tasks', () => {
    it('should return 200 and a list of tasks', async () => {
      const tasks = [
        { id: '1', title: 'Task one', status: 'active', priority: 'high' },
        { id: '2', title: 'Task two', status: 'inbox', priority: 'medium' },
      ];
      mockTasksService.list.mockResolvedValue(tasks);

      const res = await request(app.getHttpServer())
        .get('/tasks')
        .expect(200);

      expect(res.body).toEqual(tasks);
      expect(mockTasksService.list).toHaveBeenCalledWith('default', undefined);
    });

    it('should forward the view query parameter to the service', async () => {
      await request(app.getHttpServer())
        .get('/tasks?view=today')
        .expect(200);

      expect(mockTasksService.list).toHaveBeenCalledWith('default', 'today');
    });
  });

  describe('POST /tasks', () => {
    it('should create a task and return 201', async () => {
      const dto = { title: 'Buy groceries', priority: 'high' as const };
      const created = { id: 'task-123', title: 'Buy groceries', priority: 'high', status: 'inbox' };
      mockTasksService.create.mockResolvedValue(created);

      const res = await request(app.getHttpServer())
        .post('/tasks')
        .send(dto)
        .expect(201);

      expect(res.body).toEqual(created);
      expect(mockTasksService.create).toHaveBeenCalledWith('default', dto);
    });
  });

  describe('PATCH /tasks/:id', () => {
    it('should update a task and return 200', async () => {
      const taskId = 'b1a2c3d4-e5f6-4789-abcd-ef0123456789';
      const dto = { title: 'Updated title', status: 'completed' as const };
      const updated = { id: taskId, title: 'Updated title', status: 'completed', priority: 'medium' };
      mockTasksService.update.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch(`/tasks/${taskId}`)
        .send(dto)
        .expect(200);

      expect(res.body).toEqual(updated);
      expect(mockTasksService.update).toHaveBeenCalledWith(taskId, 'default', dto);
    });
  });
});
