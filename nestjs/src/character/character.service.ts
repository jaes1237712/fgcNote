import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Character } from './entities/character.entity';
import { CharacterDto } from './dtos/character.dto';
import { CharacterMoveImage } from './entities/character-move-image.entity';
import { CharacterMoveImageDto } from './dtos/character-move-image.dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class CharacterService {
  constructor(
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
    @InjectRepository(CharacterMoveImage)
    private characterMoveImageRepository: Repository<CharacterMoveImage>,
  ) {}

  async findAll(): Promise<CharacterDto[]> {
    const characters = await this.characterRepository.find({
      order: { name: 'ASC' },
    });
    return characters.map((character) => this.toCharacterDto(character));
  }

  async findMoveImages(characterId: number): Promise<CharacterMoveImageDto[]> {
    const images = await this.characterMoveImageRepository.find({
      where: { characterId },
      order: { fileName: 'ASC' },
    });
    return images.map((image) => this.toCharacterMoveImageDto(image));
  }

  async findCharacter(id: number): Promise<Character | null> {
    return this.characterRepository.findOneBy({
      id: id,
    });
  }

  async findCharacterMoveImageByFileName(
    fileName: string,
  ): Promise<CharacterMoveImage> {
    const image = await this.characterMoveImageRepository.findOne({
      where: {
        fileName: fileName,
      },
    });
    if (!image) {
      throw new NotFoundException(`File with Filename ${fileName} not found`);
    }
    return image;
  }

  findCharacterMoveImagesByFileNames(
    fileNames: string[],
  ): Promise<CharacterMoveImage[]> {
    return this.characterMoveImageRepository.find({
      where: { fileName: In(fileNames) },
    });
  }

  toCharacterDto(character: Character): CharacterDto {
    return plainToInstance(CharacterDto, character, {
      excludeExtraneousValues: true,
    });
  }

  toCharacterMoveImageDto(image: CharacterMoveImage): CharacterMoveImageDto {
    return plainToInstance(CharacterMoveImageDto, image, {
      excludeExtraneousValues: true,
    });
  }
}
