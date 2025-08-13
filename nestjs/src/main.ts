import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './root/app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // 配置靜態檔案服務
  app.useStaticAssets(join(__dirname, '..', 'assets'), {
    prefix: '/assets/',
  });

  // 配置 Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('FGC Note API')
    .setDescription('FGC Note 角色管理系統 API 文檔')
    .setVersion('1.0')
    .addTag('characters', '角色管理')
    .addTag('admin', '管理員功能')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const originsRaw = configService.get<string | string[] | undefined>(
    'CORS_ORIGINS',
  );
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
      corsOrigins = originsRaw
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
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

  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger API documentation: http://localhost:${port}/api`);
}

bootstrap();
