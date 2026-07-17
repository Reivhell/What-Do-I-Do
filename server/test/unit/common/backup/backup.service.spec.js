"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const backup_service_1 = require("../../../../src/common/backup/backup.service");
jest.mock('fs', () => {
    const mockFs = {
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
const fs = __importStar(require("fs"));
describe('BackupService', () => {
    let service;
    beforeEach(async () => {
        jest.clearAllMocks();
        fs.existsSync.mockReturnValue(true);
        fs.mkdirSync.mockImplementation(() => undefined);
        fs.readdirSync.mockReturnValue([]);
        const module = await testing_1.Test.createTestingModule({
            providers: [backup_service_1.BackupService],
        }).compile();
        service = module.get(backup_service_1.BackupService);
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
            fs.writeFileSync.mockImplementationOnce(() => { throw new Error('EACCES'); });
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
            fs.existsSync.mockReturnValueOnce(false);
            const result = service.backup();
            expect(result).toBe('');
        });
    });
    describe('pruneRetention', () => {
        it('should not prune if backup dir missing', () => {
            fs.existsSync.mockReturnValueOnce(false);
            service.pruneRetention(14);
            expect(fs.readdirSync).not.toHaveBeenCalled();
        });
        it('should prune old backup files', () => {
            const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
            fs.readdirSync.mockReturnValueOnce(['what-do-i-do-old.db', 'other-file.txt']);
            fs.statSync.mockReturnValueOnce({ mtimeMs: oldDate.getTime() });
            service.pruneRetention(14);
            expect(fs.rmSync).toHaveBeenCalled();
        });
        it('should skip non-backup files', () => {
            fs.readdirSync.mockReturnValueOnce(['random.txt', 'notes.md']);
            service.pruneRetention(14);
            expect(fs.rmSync).not.toHaveBeenCalled();
        });
    });
});
