import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
} from '@nestjs/common';
import { InboxService, CaptureStatus } from './inbox.service';
import { CreateCaptureDto } from './dto/create-capture.dto';
import { UpdateCaptureDto } from './dto/update-capture.dto';
import { ConvertCaptureDto } from './dto/convert-capture.dto';

const DEFAULT_USER_ID = 'default';

@Controller('inbox')
export class InboxController {
  constructor(private readonly inboxService: InboxService) {}

  @Get()
  list(@Query('status') status?: CaptureStatus, @Query('q') q?: string) {
    return this.inboxService.list(DEFAULT_USER_ID, status, q);
  }

  @Post()
  create(@Body() body: CreateCaptureDto) {
    return this.inboxService.create(DEFAULT_USER_ID, body);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: UpdateCaptureDto,
  ) {
    return this.inboxService.update(id, DEFAULT_USER_ID, body);
  }

  @Post(':id/archive')
  archive(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboxService.archive(id, DEFAULT_USER_ID);
  }

  @Post(':id/convert')
  convert(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: ConvertCaptureDto,
  ) {
    return this.inboxService.convert(id, DEFAULT_USER_ID, body.targetType);
  }

  @Delete(':id')
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.inboxService.delete(id, DEFAULT_USER_ID);
  }
}
