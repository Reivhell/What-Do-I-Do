import { Global, Module } from '@nestjs/common';
import { LoggerService } from './logger.service.js'
import { LoggerInterceptor } from './logger.interceptor.js'

@Global()
@Module({
  providers: [LoggerService, LoggerInterceptor],
  exports: [LoggerService, LoggerInterceptor],
})
export class LoggerModule {}