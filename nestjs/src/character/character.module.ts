import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Character } from '../entities/character.entity';
import { CharacterMoveImage } from '../entities/character-move-image.entity';
import { CharacterService } from './services/character.service';
import { CharacterSyncService } from './services/character-sync.service';
import { CharacterController } from './controllers/character.controller';
import { CharacterAdminController } from './controllers/character-admin.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Character, CharacterMoveImage])],
  controllers: [CharacterController, CharacterAdminController],
  providers: [CharacterService, CharacterSyncService],
  exports: [CharacterService, CharacterSyncService],
})
export class CharacterModule {}
