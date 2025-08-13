import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { SessionGuard } from '../common/session.guard';
import { Algorithm } from 'jsonwebtoken'; // 導入 Algorithm 類型

@Module({
  imports: [
    ConfigModule,
    TypeOrmModule.forFeature([User]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: { algorithm: config.get<Algorithm>('JWT_ALGORITHM') },
      }),
    }),
  ],
  controllers: [UserController],
  providers: [UserService, SessionGuard],
  exports: [UserService, TypeOrmModule], // <--- 確保 UserService 被導出，TypeOrmModule 也可能需要導出
})
export class UserModule {}
