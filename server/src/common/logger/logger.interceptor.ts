import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Logger,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { LoggerService } from './logger.service';

@Injectable()
export class LoggerInterceptor implements NestInterceptor {
  private readonly logger = new Logger(LoggerInterceptor.name);

  constructor(private readonly loggerService: LoggerService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse();
    const { method, url, ip, headers } = request;
    const userAgent = headers['user-agent'] || '';
    const startTime = Date.now();

    this.loggerService.debug(
      `${method} ${url} - ${ip} - ${userAgent}`,
      'HTTP',
      { method, url, ip, userAgent },
    );

    return next.handle().pipe(
      tap({
        next: () => {
          const { statusCode } = response;
          const responseTime = Date.now() - startTime;
          this.loggerService.info(
            `${method} ${url} ${statusCode} - ${responseTime}ms`,
            'HTTP',
            { method, url, statusCode, responseTime, ip, userAgent },
          );
        },
        error: (error: Error) => {
          const responseTime = Date.now() - startTime;
          this.loggerService.error(
            `${method} ${url} - ${error.message} - ${responseTime}ms`,
            'HTTP',
            { method, url, error: error.message, stack: error.stack, responseTime, ip, userAgent },
          );
        },
      }),
    );
  }
}