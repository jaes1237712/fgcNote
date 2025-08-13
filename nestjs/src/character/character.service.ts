import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character, CharacterDto } from './entities/character.entity';
import {
  CharacterMoveImage,
  CharacterImageDto,
} from './entities/character-move-image.entity';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(CharacterMoveImage)
    private imageRepository: Repository<CharacterMoveImage>,
  ) {}

  async findAll(): Promise<CharacterDto[]> {
    const characters = await this.characterRepository.find({
      order: { name: 'ASC' },
    });

    return characters.map((char) => ({
      ...char,
    }));
  }

  async findMoveImages(characterId: number): Promise<CharacterImageDto[]> {
    const images = await this.imageRepository.find({
      where: { characterId },
      order: { fileName: 'ASC' },
    });

    return images.map((image) => ({
      fileName: image.fileName,
      filePath: image.filePath,
      characterId: image.characterId,
    }));
  }
}
