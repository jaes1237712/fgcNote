import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
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
    private imageRepository: Repository<CharacterMoveImage>,
  ) {}

  async findAll(): Promise<CharacterDto[]> {
    const characters = await this.characterRepository.find({
      order: { name: 'ASC' },
    });
    return characters.map((character) => this.toCharacterDto(character));
  }

  async findMoveImages(characterId: number): Promise<CharacterMoveImageDto[]> {
    const images = await this.imageRepository.find({
      where: { characterId },
      order: { fileName: 'ASC' },
    });
    return images.map((image) => this.toCharacterMoveImageDto(image));
  }

  toCharacterDto(character: Character): CharacterDto{
    return plainToInstance(CharacterDto, character, {excludeExtraneousValues:true});
  }
  
  toCharacterMoveImageDto(image: CharacterMoveImage): CharacterMoveImageDto{
    return plainToInstance(CharacterMoveImageDto, image, {excludeExtraneousValues:true})
  }
}
