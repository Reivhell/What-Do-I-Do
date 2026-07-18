import { Test } from '@nestjs/testing';
import { BackupService } from '../../../../src/common/backup/backup.service';

jest.mock('fs', () => {
  const mockFs: Record<string, jest.Mock> = {
    existsSync: jest.fn().mockReturnValue(true),
    mkdirSync: jest.fn(),
    readdirSync: jest.fn().mockReturnValue([]),
    writeFileSync: jest.fn(),
    rmSync: jest.fn(),
    statSync: jest.fn(),
  };
  return mockFs;
});

jest.mock('better-sqlite3', () => {
  return jest.fn().mockImplementation(() => ({
    pragma: jest.fn(),
    exec: jest.fn(),
    close: jest.fn(),
  }));
});

import * as fs from 'fs';

describe('BackupService', () => {
  let service: BackupService;

  beforeEach(async () => {
    jest.clearAllMocks();
    (fs.existsSync as jest.Mock).mockReturnValue(true);
    (fs.mkdirSync as jest.Mock).mockImplementation(() => undefined);
    (fs.readdirSync as jest.Mock).mockReturnValue([]);

    const module = await Test.createTestingModule({
      providers: [BackupService],
    }).compile();
    service = module.get(BackupService);
  });

  describe('getConfig', () => {
    it('should return current config', () => {
      const config = service.getConfig();
      expect(config).toHaveProperty('backupDir');
      expect(config).toHaveProperty('retentionDays');
      expect(config).toHaveProperty('dbPath');
    });
  });

  describe('updateConfig', () => {
    it('should update retention days', () => {
      const result = service.updateConfig({ retentionDays: 30 });
      expect(result.retentionDays).toBe(30);
    });

    it('should throw on invalid retention days', () => {
      expect(() => service.updateConfig({ retentionDays: 0 })).toThrow('Retention days must be a positive integer');
    });

    it('should throw on non-positive retention days', () => {
      expect(() => service.updateConfig({ retentionDays: -1 })).toThrow('Retention days must be a positive integer');
    });

    it('should update backup directory if writable', () => {
      const result = service.updateConfig({ backupDir: '/tmp/new-backups' });
      expect(result.backupDir).toBe('/tmp/new-backups');
      expect(fs.mkdirSync).toHaveBeenCalled();
    });

    it('should throw if backup directory not writable', () => {
      (fs.writeFileSync as jest.Mock).mockImplementationOnce(() => { throw new Error('EACCES'); });

      expect(() => service.updateConfig({ backupDir: '/protected' })).toThrow('Backup directory not writable');
    });
  });

  describe('backup', () => {
    it('should create a backup file', () => {
      const result = service.backup('test-label');

      expect(result).toContain('test-label');
      expect(result).toContain('.db');
    });

    it('should return empty string if DB file missing', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      const result = service.backup();

      expect(result).toBe('');
    });
  });

  describe('pruneRetention', () => {
    it('should not prune if backup dir missing', () => {
      (fs.existsSync as jest.Mock).mockReturnValueOnce(false);

      service.pruneRetention(14);

      expect(fs.readdirSync).not.toHaveBeenCalled();
    });

    it('should prune old backup files', () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      (fs.readdirSync as jest.Mock).mockReturnValueOnce(['what-do-i-do-old.db', 'other-file.txt']);
      (fs.statSync as jest.Mock).mockReturnValueOnce({ mtimeMs: oldDate.getTime() });

      service.pruneRetention(14);

      expect(fs.rmSync).toHaveBeenCalled();
    });

    it('should skip non-backup files', () => {
      (fs.readdirSync as jest.Mock).mockReturnValueOnce(['random.txt', 'notes.md']);

      service.pruneRetention(14);

      expect(fs.rmSync).not.toHaveBeenCalled();
    });
  });
});
