import { Test } from '@nestjs/testing';
import { SettingsService } from '../../../../src/modules/settings/settings.service';
import { BackupService } from '../../../../src/common/backup/backup.service';
import { DRIZZLE } from '../../../../src/common/database/drizzle.provider';

const mockDb = { insert: jest.fn(), select: jest.fn(), query: {} };
const mockBackup = { getConfig: jest.fn(() => ({})), backup: jest.fn() };

describe('SettingsService', () => {
  let service: SettingsService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: DRIZZLE, useValue: mockDb },
        { provide: BackupService, useValue: mockBackup },
      ],
    }).compile();
    service = module.get(SettingsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
