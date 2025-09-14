import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from 'src/user/entities/user.entity';
import { Character } from 'src/character/entities/character.entity';
import { CharacterMoveImage } from 'src/character/entities/character-move-image.entity';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { CharacterModule } from 'src/character/character.module';
import { CharacterDbSyncModule } from 'src/character-db-sync/character-db-sync.module';
import { CanvasNumpadBlock } from 'src/canvas/entities/canvas-numpad-block.entity';
import { CanvasStage } from 'src/canvas/entities/canvas-stage.entity';
import { CanvasCharacterMoveImage } from 'src/canvas/entities/canvas-character-move-image.entity';
import { CanvasModule } from 'src/canvas/canvas.module';
import { CanvasArrow } from 'src/canvas/entities/canvas-arrow.entity';
import { CanvasText } from 'src/canvas/entities/canvas-text.entity';
import { CanvasVideo } from 'src/canvas/entities/canvas-video.entity';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),
    TypeOrmModule.forRootAsync({
      useFactory: () => ({
        type: 'sqlite',
        database: process.env.SQLITE_URL,
        entities: [
          User,
          Character,
          CharacterMoveImage,
          CanvasNumpadBlock,
          CanvasStage,
          CanvasCharacterMoveImage,
          CanvasArrow,
          CanvasText,
          CanvasVideo,
        ],
        synchronize: true,
      }),
    }),
    AuthModule,
    UserModule,
    CharacterModule,
    CharacterDbSyncModule,
    CanvasModule,
  ],
})
export class AppModule {}
