import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import pino, { Logger, LoggerOptions, Level, LevelWithSilentOrString } from 'pino';
import { existsSync, mkdirSync } from 'fs';
import { join } from 'path';

export interface LogContext {
  [key: string]: unknown;
}

@Injectable()
export class LoggerService implements OnModuleInit, OnModuleDestroy {
  private logger: Logger;
  private childLoggers: Map<string, Logger> = new Map();

  constructor() {
    const logDir = join(process.cwd(), 'logs');
    if (!existsSync(logDir)) {
      mkdirSync(logDir, { recursive: true });
    }

    const isDevelopment = process.env.NODE_ENV !== 'production';
    const logLevel: Level = (process.env.LOG_LEVEL as Level) || (isDevelopment ? 'debug' : 'info');

    const options: LoggerOptions = {
      level: logLevel,
      transport: isDevelopment
        ? {
            target: 'pino-pretty',
            options: {
              colorize: true,
              translateTime: 'SYS:standard',
              ignore: 'pid,hostname',
            },
          }
        : undefined,
    };

    if (!isDevelopment) {
      this.logger = pino({ ...options, level: logLevel }, pino.destination(join(logDir, 'app.log')));
    } else {
      this.logger = pino(options);
    }
  }

  onModuleInit() {
    this.log('LoggerModule initialized', 'LoggerModule');
  }

  onModuleDestroy() {
    this.logger.flush();
  }

  getLogger(context?: string): Logger {
    if (!context) {
      return this.logger;
    }

    if (!this.childLoggers.has(context)) {
      this.childLoggers.set(context, this.logger.child({ context }));
    }
    return this.childLoggers.get(context)!;
  }

  error(message: string, context?: string, meta?: LogContext): void {
    this.getLogger(context).error(meta, message);
  }

  warn(message: string, context?: string, meta?: LogContext): void {
    this.getLogger(context).warn(meta, message);
  }

  info(message: string, context?: string, meta?: LogContext): void {
    this.getLogger(context).info(meta, message);
  }

  debug(message: string, context?: string, meta?: LogContext): void {
    this.getLogger(context).debug(meta, message);
  }

  verbose(message: string, context?: string, meta?: LogContext): void {
    this.getLogger(context).trace(meta, message);
  }

  log(message: string, context?: string, meta?: LogContext): void {
    this.info(message, context, meta);
  }

  child(context: Record<string, unknown>): Logger {
    return this.logger.child(context);
  }

  setLevel(level: Level): void {
    this.logger.level = level;
  }

  getLevel(): LevelWithSilentOrString {
    return this.logger.level;
  }
}