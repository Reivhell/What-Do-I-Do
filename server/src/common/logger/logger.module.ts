import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service';
import { LoggerInterceptor } from './logger.interceptor';

@Global()
@Module({
  providers: [LoggerService, LoggerInterceptor],
  exports: [LoggerService, LoggerInterceptor],
})
export class LoggerModule {}