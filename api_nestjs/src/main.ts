import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './root/app.module';
import * as cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = app.get(ConfigService);
  const originsRaw = config.get<string | string[] | undefined>('CORS_ORIGINS');
  let corsOrigins: string[] = [
    'http://localhost:5173',
    'http://localhost:8080',
    'https://localhost:5173',
  ];
  if (Array.isArray(originsRaw)) {
    corsOrigins = originsRaw;
  } else if (typeof originsRaw === 'string' && originsRaw.trim().length > 0) {
    try {
      const parsed = JSON.parse(originsRaw);
      if (Array.isArray(parsed)) corsOrigins = parsed;
    } catch {
      corsOrigins = originsRaw.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: '*',
    exposedHeaders: '*',
  });

  app.use(cookieParser());

  const port = config.get<number>('PORT') ?? 3000;
  await app.listen(port);
}

bootstrap();


