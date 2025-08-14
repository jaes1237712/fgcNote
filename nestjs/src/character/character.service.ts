import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Character} from './entities/character.entity';
import {CharacterDto} from './dtos/character.dto';
import {CharacterMoveImage} from './entities/character-move-image.entity';
import {CharacterMoveImageDto} from './dtos/character-move-image.dto';


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

  async findMoveImages(characterId: number): Promise<CharacterMoveImageDto[]> {
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
