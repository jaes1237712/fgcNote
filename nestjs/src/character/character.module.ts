import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from 'src/character/entities/character.entity';
import { CharacterMoveImage } from 'src/character/entities/character-move-image.entity';
import { CharacterService } from './character.service';
import { CharacterController } from './character.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Character, CharacterMoveImage])],
  controllers: [CharacterController],
  providers: [CharacterService],
  exports: [CharacterService],
})
export class CharacterModule {}
