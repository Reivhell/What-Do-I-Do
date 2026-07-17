import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { ActivityTrackerController } from '../../../../src/modules/activity-tracker/activity-tracker.controller';
import { ActivityTrackerService } from '../../../../src/modules/activity-tracker/activity-tracker.service';

const mockActivityTrackerService = {
  start: jest.fn(),
  stop: jest.fn(),
  getActiveSession: jest.fn(),
};

describe('ActivityTrackerController (integration)', () => {
  let app: INestApplication;
  let service: typeof mockActivityTrackerService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [ActivityTrackerController],
      providers: [{ provide: ActivityTrackerService, useValue: mockActivityTrackerService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get(ActivityTrackerService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /activity/start', () => {
    it('should start a session and return 201', async () => {
      const dto = { activityName: 'Reading', category: 'learning' };
      const session = {
        id: 'session-abc',
        userId: 'default',
        activityName: 'Reading',
        category: 'learning',
        startTime: '2026-07-16T10:00:00.000Z',
        endTime: null,
        note: null,
      };
      mockActivityTrackerService.start.mockResolvedValue(session);

      const res = await request(app.getHttpServer())
        .post('/activity/start')
        .send(dto)
        .expect(201);

      expect(res.body).toEqual(session);
      expect(mockActivityTrackerService.start).toHaveBeenCalledWith('default', dto);
    });
  });

  describe('POST /activity/stop/:id', () => {
    it('should stop a session and return 201', async () => {
      const sessionId = '22222222-2222-4222-8222-222222222222';
      const stopped = {
        id: sessionId,
        userId: 'default',
        activityName: 'Reading',
        category: 'learning',
        startTime: '2026-07-16T10:00:00.000Z',
        endTime: '2026-07-16T11:00:00.000Z',
        note: null,
      };
      mockActivityTrackerService.stop.mockResolvedValue(stopped);

      const res = await request(app.getHttpServer())
        .post(`/activity/stop/${sessionId}`)
        .expect(201);

      expect(res.body).toEqual(stopped);
      expect(mockActivityTrackerService.stop).toHaveBeenCalledWith('default', sessionId);
    });
  });

  describe('GET /activity/active', () => {
    it('should return the currently active session', async () => {
      const active = {
        id: 'session-active',
        userId: 'default',
        activityName: 'Coding',
        category: 'work',
        startTime: '2026-07-16T09:00:00.000Z',
        endTime: null,
        note: null,
      };
      mockActivityTrackerService.getActiveSession.mockResolvedValue(active);

      const res = await request(app.getHttpServer())
        .get('/activity/active')
        .expect(200);

      expect(res.body).toEqual(active);
      expect(mockActivityTrackerService.getActiveSession).toHaveBeenCalledWith('default');
    });

    it('should return null when no session is active', async () => {
      mockActivityTrackerService.getActiveSession.mockResolvedValue(null);

      const res = await request(app.getHttpServer())
        .get('/activity/active')
        .expect(200);

      expect(res.body).toBeNull();
    });
  });
});
