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
} from '@nestjs/common';
import { SettingsService } from './settings.service';

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

  @Get('export')
  exportData() {
    return this.settingsService.exportData(DEFAULT_USER_ID);
  }

  @Post('import')
  @HttpCode(200)
  importData(
    @Body() body: { exportedAt: string; appVersion: string; data: Record<string, unknown[]> },
  ) {
    return this.settingsService.importData(DEFAULT_USER_ID, body);
  }
}
