import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanvasNumpadBlock } from './entities/canvas-numpad-block.entity';
import { CanvasNumpadBlockDto } from './dtos/numpad/canvas-numpad-block.entity.dto';
import {} from './entities/canvas-character-move-image.entity';
import {} from './dtos/move_image/canvas-character-move-image.dto';
import { CanvasStage } from './entities/canvas-stage.entity';
import { CanvasStageDto } from './dtos/stage/canvas-stage.dto';
import { CreateCanvasStageDto } from './dtos/stage/create-canvas-stage.dto';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { Character } from 'src/character/entities/character.entity';
import { UpdateCanvasStageDto } from './dtos/stage/update-stage.dto';
import { DeleteResult } from 'typeorm/browser';

@Injectable()
export class CanvasService {
  constructor(
    @InjectRepository(CanvasNumpadBlock)
    private canvasNumpadBlockRepository: Repository<CanvasNumpadBlock>,
    @InjectRepository(CanvasStage)
    private canvasStageRepository: Repository<CanvasStage>,
    @InjectRepository(Character)
    private characterRepository: Repository<Character>,
  ) {}

  async findAllStage(user: User): Promise<CanvasStageDto[]> {
    const stages = await this.canvasStageRepository.find({
      where: {
        user: user,
      },
    });
    return stages.map((stage) => this.toStageDto(stage));
  }

  async findAllNumpadBlocksByStage(
    stageId: string,
  ): Promise<CanvasNumpadBlockDto[]> {
    const blocks = await this.canvasNumpadBlockRepository.find({
      where: {
        stage: { id: stageId },
      },
    });
    return blocks.map((block) => this.toNumpadBlockDto(block));
  }

  async createStage(
    stage: CreateCanvasStageDto,
    user: User,
  ): Promise<CanvasStageDto> {
    const characterMe = await this.characterRepository.findOneBy({
      id: stage.characterMe.id,
    });
    if (!characterMe) {
      throw new NotFoundException(
        `Character with ID ${stage.characterMe.id} not found.`,
      );
    }

    const characterOpponent = await this.characterRepository.findOneBy({
      id: stage.characterOpponent.id,
    });
    if (!characterOpponent) {
      throw new NotFoundException(
        `Character with ID ${stage.characterOpponent.id} not found.`,
      );
    }
    const stageEntity = this.canvasStageRepository.create({
      id: stage.id,
      characterMe: characterMe,
      characterOpponent: characterOpponent,
      name: stage.name,
      user: user,
    });
    const savedStage = await this.canvasStageRepository.save(stageEntity);
    return this.toStageDto(savedStage);
  }

  async updateStage(
    updateCanvasStageDto: UpdateCanvasStageDto,
    user: User,
  ): Promise<CanvasStageDto> {
    const stageToUpdate = await this.canvasStageRepository.findOneBy({
      id: updateCanvasStageDto.id,
    });
    if (stageToUpdate?.user.id != user.id) {
      throw new UnauthorizedException('The stage not belong to this user');
    }
    if (!stageToUpdate) {
      throw new NotFoundException(
        `Stage with ID ${updateCanvasStageDto.id} not found.`,
      );
    }
    if (updateCanvasStageDto.name !== undefined) {
      // 檢查是否提供了 name 字段
      stageToUpdate.name = updateCanvasStageDto.name;
    }
    return this.toStageDto(
      await this.canvasStageRepository.save(stageToUpdate),
    );
  }

  async removeStage(stageId: string, user: User): Promise<boolean> {
    const targetStage = await this.canvasStageRepository.findOneBy({
      id: stageId,
    });
    if (!targetStage) {
      throw new NotFoundException(`Stage with ID "${stageId}" not found`);
    } else if (targetStage.user.id != user.id) {
      throw new UnauthorizedException('The stage not belong to this user');
    }

    const deleteResult: DeleteResult =
      await this.canvasStageRepository.delete(stageId);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Stage with ID "${stageId}" not found`);
    }
    return true;
  }

  toStageDto(stage: CanvasStage): CanvasStageDto {
    return plainToInstance(CanvasStageDto, stage, {
      excludeExtraneousValues: true,
    });
  }

  toNumpadBlockDto(numpadBlock: CanvasNumpadBlock): CanvasNumpadBlockDto {
    return plainToInstance(CanvasNumpadBlockDto, numpadBlock, {
      excludeExtraneousValues: true,
    });
  }
}
