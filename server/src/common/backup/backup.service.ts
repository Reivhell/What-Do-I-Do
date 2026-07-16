import { Injectable, Logger } from '@nestjs/common';
import Database from 'better-sqlite3';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Atomic, consistent DB snapshot via SQLite `VACUUM INTO` (folds committed WAL
 * into a single clean file). Used by scheduled backup, pre-import and pre-migration safety nets.
 */
@Injectable()
export class BackupService {
  private readonly logger = new Logger(BackupService.name);

  private readonly config = {
    backupDir: process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),
    retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS || '14', 10),
    dbPath: process.env.DATABASE_PATH || path.join(process.cwd(), 'what-do-i-do.db'),
  };

  private dbPath(): string {
    return this.config.dbPath;
  }

  private backupsDir(): string {
    return this.config.backupDir;
  }

  /** Copy the live DB into backups/ with a timestamp + optional label. Returns the written path. */
  backup(label = 'auto'): string {
    const src = this.dbPath();
    if (!fs.existsSync(src)) {
      this.logger.warn(`No DB file at ${src} — skipping backup`);
      return '';
    }
    const dir = this.backupsDir();
    fs.mkdirSync(dir, { recursive: true });
    const ts = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const dest = path.join(dir, `what-do-i-do-${ts}-${label}.db`);
    // ponytail: open a throwaway read connection per backup (VACUUM INTO copies through it).
    const conn = new Database(src, { readonly: true, fileMustExist: true });
    try {
      conn.pragma('journal_mode = WAL');
      conn.exec(`VACUUM INTO '${dest.replace(/'/g, "''")}'`);
    } finally {
      conn.close();
    }
    return dest;
  }

  /** Delete snapshots older than `retentionDays` (mtime-based). */
  pruneRetention(retentionDays = this.config.retentionDays): void {
    const dir = this.backupsDir();
    if (!fs.existsSync(dir)) return;
    const cutoff = Date.now() - retentionDays * 24 * 60 * 60 * 1000;
    for (const f of fs.readdirSync(dir)) {
      if (!f.startsWith('what-do-i-do-')) continue;
      const full = path.join(dir, f);
      try {
        if (fs.statSync(full).mtimeMs < cutoff) fs.rmSync(full);
      } catch {
        /* ponytail: skip files we can't stat */
      }
    }
  }

  /** Returns current backup configuration. */
  getConfig(): { backupDir: string; retentionDays: number; dbPath: string } {
    return { ...this.config };
  }

  /** Updates backup directory (validates writability) and retention days. */
  updateConfig(config: { backupDir?: string; retentionDays?: number }): { backupDir: string; retentionDays: number } {
    if (config.backupDir !== undefined) {
      const testFile = path.join(config.backupDir, '.write-test');
      try {
        fs.mkdirSync(config.backupDir, { recursive: true });
        fs.writeFileSync(testFile, 'test');
        fs.rmSync(testFile);
        this.config.backupDir = config.backupDir;
      } catch (e) {
        throw new Error(`Backup directory not writable: ${config.backupDir}`);
      }
    }
    if (config.retentionDays !== undefined) {
      const days = parseInt(String(config.retentionDays), 10);
      if (isNaN(days) || days < 1) throw new Error('Retention days must be a positive integer');
      this.config.retentionDays = days;
    }
    return { backupDir: this.config.backupDir, retentionDays: this.config.retentionDays };
  }
}
