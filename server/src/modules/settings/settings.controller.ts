import {
  Controller,
  Get,
  Patch,
  Post,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  DefaultValuePipe,
  ParseBoolPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SettingsService } from './settings.service.js'
import * as bcrypt from 'bcrypt';

// Temp user ID for single-user mode — will be replaced with app-lock auth
const DEFAULT_USER_ID = 'default';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // ── Profile ──
  @Get('profile')
  getProfile() {
    return this.settingsService.getProfile(DEFAULT_USER_ID);
  }

  @Patch('profile')
  updateProfile(
    @Body() body: { name?: string; email?: string; avatarUrl?: string; bio?: string },
  ) {
    return this.settingsService.updateProfile(DEFAULT_USER_ID, body);
  }

  // ── Preferences ──
  @Get('preferences')
  getPreferences() {
    return this.settingsService.getPreferences(DEFAULT_USER_ID);
  }

  @Patch('preferences')
  updatePreferences(
    @Body()
    body: {
      theme?: string;
      language?: string;
      currency?: string;
      timezone?: string;
      dateFormat?: string;
      timeFormat?: string;
      categoryTimeMapping?: Record<string, string>;
      // Money-specific preferences
      budgetAlertEnabled?: boolean;
      defaultBudgetPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
      transactionCategories?: Record<string, string>;
    },
  ) {
    return this.settingsService.updatePreferences(DEFAULT_USER_ID, body);
  }

  // ── Notifications ──
  @Get('notifications')
  getNotifications() {
    return this.settingsService.getNotifications(DEFAULT_USER_ID);
  }

  @Patch('notifications')
  updateNotifications(
    @Body()
    body: {
      plannerReminderEnabled?: boolean;
      habitReminderEnabled?: boolean;
      budgetAlertEnabled?: boolean;
      goalReminderEnabled?: boolean;
      achievementAlertEnabled?: boolean;
    },
  ) {
    return this.settingsService.updateNotifications(DEFAULT_USER_ID, body);
  }

  // ── Categories ──
  @Get('categories')
  getCategories(@Query('domain') domain?: string) {
    return this.settingsService.getCategories(DEFAULT_USER_ID, domain);
  }

  @Post('categories')
  createCategory(
    @Body() body: { domain: string; name: string; color: string },
  ) {
    return this.settingsService.createCategory(DEFAULT_USER_ID, body);
  }

  @Delete('categories/:id')
  deleteCategory(@Param('id', ParseUUIDPipe) id: string) {
    return this.settingsService.deleteCategory(id);
  }

  // ── Backup / Export / Import (17-offline-sync.md) ──

  @Get('backup/config')
  getBackupConfig() {
    return this.settingsService.getBackupConfig();
  }

  @Patch('backup/config')
  updateBackupConfig(
    @Body() body: { backupDir?: string; retentionDays?: number },
  ) {
    return this.settingsService.updateBackupConfig(body);
  }

  @Post('backup/trigger')
  @HttpCode(200)
  triggerBackup(@Body() body?: { label?: string }) {
    return this.settingsService.triggerBackup(body?.label);
  }

  @Get('export')
  exportData() {
    return this.settingsService.exportData(DEFAULT_USER_ID);
  }

  @Post('import')
  @HttpCode(200)
  importData(
    @Body() body: { exportedAt: string; appVersion: string; data: Record<string, unknown[]> },
    @Query('dryRun', new DefaultValuePipe(false), ParseBoolPipe) dryRun: boolean,
  ) {
    return this.settingsService.importData(DEFAULT_USER_ID, body, dryRun);
  }

  @Post('import/validate')
  @HttpCode(200)
  validateImport(
    @Body() body: { exportedAt: string; appVersion: string; data: Record<string, unknown[]> },
  ) {
    return this.settingsService.validateImport(body);
  }

  // ── PIN Lock ──
  @Get('pin')
  getPinSettings() {
    return this.settingsService.getPinSettings(DEFAULT_USER_ID);
  }

  @Post('pin')
  @HttpCode(HttpStatus.CREATED)
  async setPin(@Body() body: { pin: string; confirmPin: string }) {
    if (body.pin !== body.confirmPin) {
      return { success: false, error: 'PINs do not match' };
    }
    if (!/^\d{4,8}$/.test(body.pin)) {
      return { success: false, error: 'PIN must be 4-8 digits' };
    }
    await this.settingsService.setPin(DEFAULT_USER_ID, body.pin);
    return { success: true };
  }

  @Post('pin/verify')
  @HttpCode(HttpStatus.OK)
  async verifyPin(@Body() body: { pin: string }) {
    const valid = await this.settingsService.verifyPin(DEFAULT_USER_ID, body.pin);
    return { success: valid };
  }

  @Patch('pin')
  updatePinSettings(
    @Body() body: { enabled?: boolean; autoLockMinutes?: number },
  ) {
    return this.settingsService.updatePinSettings(DEFAULT_USER_ID, body);
  }
}
