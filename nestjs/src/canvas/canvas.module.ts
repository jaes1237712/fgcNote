import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CanvasStage } from './entities/canvas-stage.entity';
import { CanvasNumpadBlock } from './entities/canvas-numpad-block.entity';
import { CanvasService } from './canvas.service';
import { CanvasController } from './canvas.controller';

@Module({
  imports: [TypeOrmModule.forFeature([CanvasStage, CanvasNumpadBlock])],
  controllers: [CanvasController],
  providers: [CanvasService],
  exports: [CanvasService],
})
export class CharacterModule {}
