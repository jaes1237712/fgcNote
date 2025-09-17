import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasStage } from './entities/canvas-stage.entity';
import { CanvasNumpadBlock } from './entities/canvas-numpad-block.entity';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';
import { JwtModule } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Algorithm } from 'jsonwebtoken';
import { CharacterModule } from 'src/character/character.module';
import { UserModule } from 'src/user/user.module';
import { CanvasCharacterMoveImage } from './entities/canvas-character-move-image.entity';
import { CanvasArrow } from './entities/canvas-arrow.entity';
import { CanvasText } from './entities/canvas-text.entity';
import { CanvasVideo } from './entities/canvas-video.entity';
import { CanvasArrowAnchor } from './entities/canvas-arrow-anchor.entity';

@Module({
  imports: [
    CharacterModule,
    UserModule,
    TypeOrmModule.forFeature([
      CanvasStage,
      CanvasNumpadBlock,
      CanvasCharacterMoveImage,
      CanvasArrow,
      CanvasText,
      CanvasVideo,
      CanvasArrowAnchor
    ]),
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET')!,
        signOptions: { algorithm: config.get<Algorithm>('JWT_ALGORITHM') },
      }),
    }),
  ],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CanvasModule {}
