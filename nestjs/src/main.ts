import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './root/app.module';
import cookieParser from 'cookie-parser';
import { ConfigService } from '@nestjs/config';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { LoggerInterceptor } from 'src/common/interceptors/logger.interceptor'; // 引入你的 Interceptor

async function bootstrap() {
  const httpsOptions = {
    key: readFileSync('secrets/self.key'),
    cert: readFileSync('secrets/self.crt'),
  };
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    httpsOptions,
  });

  // 配置靜態檔案服務
  app.useStaticAssets(join(__dirname, '..', 'assets'), {
    prefix: '/assets/',
    setHeaders: (res) => {
      res.setHeader('Access-Control-Allow-Origin', 'https://localhost:5173');
    },
  });

  // 配置 Swagger OpenAPI
  const config = new DocumentBuilder()
    .setTitle('FGC Note API')
    .setDescription('FGC Note 角色管理系統 API 文檔')
    .setVersion('1.0')
    .addServer('https://localhost:3000', 'Local Development Server')
    .addTag('characters', '角色管理')
    .addTag('admin', '管理員功能')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  const configService = app.get(ConfigService);
  const originsRaw = configService.get<string[]>('CORS_ORIGINS');

  const corsOrigins: string[] = originsRaw
    ? originsRaw
    : [
        'http://localhost:5173',
        'http://localhost:8080',
        'https://localhost:5173',
      ];

  app.enableCors({
    origin: corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  app.use(cookieParser());
  app.useGlobalInterceptors(new LoggerInterceptor());
  const port = configService.get<number>('PORT') ?? 3000;
  await app.listen(port);

  console.log(`🚀 Application is running on: https://localhost:${port}`);
  console.log(`📚 Swagger API documentation: https://localhost:${port}/api`);
}

bootstrap();
