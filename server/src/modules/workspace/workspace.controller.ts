import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  ParseUUIDPipe,
} from '@nestjs/common';
import { WorkspaceService, LayoutPreset, WidgetConfigItem } from './workspace.service';
import {
  CreatePresetDto,
  UpdatePresetDto,
  ActivatePresetDto,
} from './dto';

const DEFAULT_USER_ID = 'default';

@Controller('workspace')
export class WorkspaceController {
  constructor(private readonly workspaceService: WorkspaceService) {}

  @Get('presets')
  async listPresets(): Promise<LayoutPreset[]> {
    return this.workspaceService.listPresets(DEFAULT_USER_ID);
  }

  @Get('presets/active')
  async getActivePreset(): Promise<LayoutPreset | null> {
    return this.workspaceService.getActivePreset(DEFAULT_USER_ID);
  }

  @Get('widget-config')
  async getWidgetConfig(): Promise<WidgetConfigItem[]> {
    return this.workspaceService.getWidgetConfig(DEFAULT_USER_ID);
  }

  @Post('presets')
  async createPreset(@Body() body: CreatePresetDto): Promise<LayoutPreset> {
    return this.workspaceService.createPreset(DEFAULT_USER_ID, body);
  }

  @Patch('presets/:id')
  async updatePreset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdatePresetDto,
  ): Promise<LayoutPreset | null> {
    return this.workspaceService.updatePreset(id, DEFAULT_USER_ID, body);
  }

  @Post('presets/:id/activate')
  async activatePreset(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ActivatePresetDto,
  ): Promise<LayoutPreset | null> {
    return this.workspaceService.activatePreset(DEFAULT_USER_ID, id);
  }

  @Delete('presets/:id')
  async deletePreset(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<boolean> {
    return this.workspaceService.deletePreset(id, DEFAULT_USER_ID);
  }

  @Post('reset-default')
  async resetDefault(): Promise<LayoutPreset> {
    return this.workspaceService.resetDefault(DEFAULT_USER_ID);
  }
}