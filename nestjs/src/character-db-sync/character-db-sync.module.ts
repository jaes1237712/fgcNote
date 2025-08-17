import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from 'src/character/entities/character.entity';
import { CharacterMoveImage } from 'src/character/entities/character-move-image.entity';
import { CharacterSyncService } from './character-db-sync.service';

@Module({
  imports: [TypeOrmModule.forFeature([Character, CharacterMoveImage])],
  providers: [CharacterSyncService],
  exports: [CharacterSyncService],
})
export class CharacterDbSyncModule {}
