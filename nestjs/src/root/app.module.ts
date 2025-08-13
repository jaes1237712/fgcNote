import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Character } from '../entities/character.entity';
import { CharacterMoveImage } from '../entities/character-move-image.entity';
import { AuthModule } from '../auth/auth.module';
import { UserModule } from '../user/user.module';
import { CharacterModule } from '../character/character.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: process.env.SQLITE_URL || './database.sqlite',
        entities: [User, Character, CharacterMoveImage],
        synchronize: true,
      }),
    }),
    AuthModule,
    UserModule,
    CharacterModule,
  ],
})
export class AppModule {}
