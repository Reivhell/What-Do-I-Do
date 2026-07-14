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
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { InboxService, CaptureStatus } from './inbox.service';
import { CreateCaptureDto, UpdateCaptureDto, ConvertCaptureDto } from './dto';

const DEFAULT_USER_ID = 'default';

@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
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
