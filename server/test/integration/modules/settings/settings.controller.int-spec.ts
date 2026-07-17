import 'reflect-metadata';
import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { SettingsController } from '../../../../src/modules/settings/settings.controller';
import { SettingsService } from '../../../../src/modules/settings/settings.service';

const mockSettingsService = {
  getProfile: jest.fn(),
  updatePreferences: jest.fn(),
  createCategory: jest.fn(),
};

describe('SettingsController (integration)', () => {
  let app: INestApplication;
  let service: typeof mockSettingsService;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [SettingsController],
      providers: [{ provide: SettingsService, useValue: mockSettingsService }],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
    service = moduleFixture.get(SettingsService);
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /settings/profile', () => {
    it('should return the user profile', async () => {
      const profile = {
        userId: 'default',
        name: 'Alice',
        email: 'alice@example.com',
        bio: null,
        avatarUrl: null,
      };
      mockSettingsService.getProfile.mockResolvedValue(profile);

      const res = await request(app.getHttpServer())
        .get('/settings/profile')
        .expect(200);

      expect(res.body).toEqual(profile);
      expect(mockSettingsService.getProfile).toHaveBeenCalledWith('default');
    });
  });

  describe('PATCH /settings/preferences', () => {
    it('should update preferences and return 200', async () => {
      const dto = { theme: 'dark', timezone: 'Asia/Jakarta' };
      const updated = {
        userId: 'default',
        theme: 'dark',
        language: 'en',
        timezone: 'Asia/Jakarta',
        currency: 'USD',
        dateFormat: 'YYYY-MM-DD',
        timeFormat: '24h',
      };
      mockSettingsService.updatePreferences.mockResolvedValue(updated);

      const res = await request(app.getHttpServer())
        .patch('/settings/preferences')
        .send(dto)
        .expect(200);

      expect(res.body).toEqual(updated);
      expect(mockSettingsService.updatePreferences).toHaveBeenCalledWith('default', dto);
    });
  });

  describe('POST /settings/categories', () => {
    it('should create a category and return 201', async () => {
      const dto = { domain: 'task', name: 'Work', color: '#4A90D9' };
      const created = {
        id: 'cat-1',
        userId: 'default',
        domain: 'task',
        name: 'Work',
        color: '#4A90D9',
      };
      mockSettingsService.createCategory.mockResolvedValue(created);

      const res = await request(app.getHttpServer())
        .post('/settings/categories')
        .send(dto)
        .expect(201);

      expect(res.body).toEqual(created);
      expect(mockSettingsService.createCategory).toHaveBeenCalledWith('default', dto);
    });
  });
});
