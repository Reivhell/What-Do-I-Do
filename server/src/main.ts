import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { LoggerInterceptor, LoggerService } from './common/logger';
import helmet from 'helmet';
import { runMigrations } from './scripts/run-migrations';

async function bootstrap() {
  // Run migrations before starting the app
  await runMigrations();

  const app = await NestFactory.create(AppModule);

  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: true,
    hidePoweredBy: true,
    frameguard: { action: 'deny' },
  }));

  app.enableCors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  });

  app.setGlobalPrefix('api');

  const logger = app.get(LoggerService);
  app.useGlobalInterceptors(app.get(LoggerInterceptor));

  const port = process.env.SERVER_PORT || 3000;
  const host = process.env.SERVER_HOST || 'localhost';
  await app.listen(port, host);
  logger.log(`🚀 Server running on http://${host}:${port}`, 'Bootstrap');
}
bootstrap();
