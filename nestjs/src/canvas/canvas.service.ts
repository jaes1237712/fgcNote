import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanvasNumpadBlock } from './entities/canvas-numpad-block.entity';
import { CanvasNumpadBlockDto } from './dtos/numpad/canvas-numpad-block.dto';
import { CreateCanvasNumpadBlockDto } from './dtos/numpad/create-canvas-numpad-block.dto';
import { CanvasCharacterMoveImage } from './entities/canvas-character-move-image.entity';
import { CanvasCharacterMoveImageDto } from './dtos/move_image/canvas-character-move-image.dto';
import { CreateCanvasCharacterMoveImageDto } from './dtos/move_image/create-canvas-character-move-image.dto';
import { UpdateCanvasCharacterMoveImageDto } from './dtos/move_image/update-canvas-character-move-image.dto';
import { CanvasStage } from './entities/canvas-stage.entity';
import { CanvasStageDto } from './dtos/stage/canvas-stage.dto';
import { CreateCanvasStageDto } from './dtos/stage/create-canvas-stage.dto';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { UpdateCanvasStageDto } from './dtos/stage/update-canvas-stage.dto';
import { DeleteResult } from 'typeorm/browser';
import { CharacterService } from 'src/character/character.service';
import { UpdateCanvasNumpadBlockDto } from './dtos/numpad/update-canvas-numpad-block.dto';
import { CanvasArrow } from './entities/canvas-arrow.entity';
import { CreateCanvasArrowDto } from './dtos/arrow/create-arrow.dto';
import { CanvasArrowDto } from './dtos/arrow/canvas-arrow.dto';
import { UpdateCanvasArrowDto } from './dtos/arrow/update-arrow.dto';

@Injectable()
export class CanvasService {
  constructor(
    @InjectRepository(CanvasNumpadBlock)
    private canvasNumpadBlockRepository: Repository<CanvasNumpadBlock>,
    @InjectRepository(CanvasStage)
    private canvasStageRepository: Repository<CanvasStage>,
    @InjectRepository(CanvasCharacterMoveImage)
    private canvasCharacterMoveImageRepository: Repository<CanvasCharacterMoveImage>,
    @InjectRepository(CanvasArrow)
    private canvasArrowRepository: Repository<CanvasArrow>,
    private characterService: CharacterService,
  ) {}

  async getStageWithRelations(stageId: string): Promise<CanvasStage | null> {
    const stage = await this.canvasStageRepository.findOne({
      where: { id: stageId },
      relations: ['numpadBlocks'],
    });
    return stage;
  }
  async createStage(
    stage: CreateCanvasStageDto,
    user: User,
  ): Promise<CanvasStageDto> {
    const characterMe = await this.characterService.findCharacter(
      stage.characterMe.id,
    );
    if (!characterMe) {
      throw new NotFoundException(
        `Character with ID ${stage.characterMe.id} not found.`,
      );
    }

    const characterOpponent = await this.characterService.findCharacter(
      stage.characterOpponent.id,
    );
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

  async createNumpadBlock(
    block: CreateCanvasNumpadBlockDto,
    user: User,
  ): Promise<CanvasNumpadBlockDto> {
    const stage = await this.canvasStageRepository.findOne({
      where: { id: block.stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${block.stageId} not found`);
    } else {
      const blockEntity = this.canvasNumpadBlockRepository.create({
        id: block.id,
        input: block.input,
        type: block.type,
        x: block.x,
        y: block.y,
        stage: stage,
        user: user,
      });
      const savedBlock =
        await this.canvasNumpadBlockRepository.save(blockEntity);
      return this.toNumpadBlockDto(savedBlock);
    }
  }

  async createCharacterMoveImage(
    image: CreateCanvasCharacterMoveImageDto,
    user: User,
  ): Promise<CanvasCharacterMoveImageDto> {
    const stage = await this.canvasStageRepository.findOne({
      where: { id: image.stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${image.stageId} not found`);
    }
    const targetCharacterMoveImage =
      await this.characterService.findCharacterMoveImageByFileName(
        image.characterMoveImage.fileName,
      );
    const imageEntity = this.canvasCharacterMoveImageRepository.create({
      id: image.id,
      x: image.x,
      y: image.y,
      characterMoveImage: targetCharacterMoveImage,
      stage: stage,
      user: user,
    });
    const savedImage =
      await this.canvasCharacterMoveImageRepository.save(imageEntity);
    return this.toCanvasCharacterImageDto(savedImage);
  }

  async createArrow(
    arrow: CreateCanvasArrowDto,
    user: User,
  ): Promise<CanvasArrowDto> {
    const stage = await this.canvasStageRepository.findOne({
      where: { id: arrow.stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${arrow.stageId} not found`);
    } else {
      const arrowEntity = this.canvasArrowRepository.create({
        id: arrow.id,
        startNodeId: arrow.startNodeId,
        endNodeId: arrow.endNodeId,
        points: arrow.points,
        stage: stage,
        user: user,
      });
      const savedArrow = await this.canvasArrowRepository.save(arrowEntity);
      return this.toArrowDto(savedArrow);
    }
  }

  async findAllStage(user: User): Promise<CanvasStageDto[]> {
    const stages = await this.canvasStageRepository.find({
      where: {
        user: { id: user.id },
      },
    });
    // console.log(stages)
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

  async findAllCharacterMoveImageByStage(
    stageId: string,
  ): Promise<CanvasCharacterMoveImageDto[]> {
    const images = await this.canvasCharacterMoveImageRepository.find({
      where: {
        stage: { id: stageId },
      },
    });
    return images.map((images) => this.toCanvasCharacterImageDto(images));
  }

  async findAllArrowsByStage(stageId: string): Promise<CanvasArrowDto[]> {
    const arrows = await this.canvasArrowRepository.find({
      where: {
        stage: { id: stageId },
      },
    });
    console.log('arrowData from db', arrows)
    return arrows.map((arrow) => this.toArrowDto(arrow));
  }

  async updateNumpadBlock(
    block: UpdateCanvasNumpadBlockDto,
    user: User,
  ): Promise<CanvasNumpadBlockDto> {
    const targetBlock = await this.canvasNumpadBlockRepository.findOne({
      where: { id: block.id },
    });

    if (!targetBlock) {
      throw new NotFoundException(`Block with ID ${block.id} not found`);
    }

    // 3. Update the properties of the found entity
    targetBlock.input = block.input;
    targetBlock.type = block.type;
    targetBlock.x = block.x;
    targetBlock.y = block.y;
    // Assign the found stage entity to the block's stage relationship
    const savedBlock = await this.canvasNumpadBlockRepository.save(targetBlock);
    return this.toNumpadBlockDto(savedBlock);
  }

  async updateCharacterMoveImage(
    image: UpdateCanvasCharacterMoveImageDto,
    user: User,
  ): Promise<CanvasCharacterMoveImageDto> {
    const targetImage = await this.canvasCharacterMoveImageRepository.findOne({
      where: { id: image.id },
    });
    const targetCharacterMoveImage =
      await this.characterService.findCharacterMoveImageByFileName(
        image.characterMoveImage.fileName,
      );

    if (!targetImage) {
      throw new NotFoundException(`Block with ID ${image.id} not found`);
    }

    // 3. Update the properties of the found entity
    targetImage.x = image.x;
    targetImage.y = image.y;
    targetImage.characterMoveImage = targetCharacterMoveImage;
    // Assign the found stage entity to the block's stage relationship
    const savedImage =
      await this.canvasCharacterMoveImageRepository.save(targetImage);
    return this.toCanvasCharacterImageDto(savedImage);
  }

  async updateArrow(
    arrow: UpdateCanvasArrowDto,
    user: User,
  ): Promise<CanvasArrowDto> {
    const targetArrow = await this.canvasArrowRepository.findOne({
      where: { id: arrow.id },
    });

    if (!targetArrow) {
      throw new NotFoundException(`Arrow with ID ${arrow.id} not found`);
    }

    targetArrow.startNodeId = arrow.startNodeId;
    targetArrow.endNodeId = arrow.endNodeId;
    targetArrow.points = arrow.points;

    const savedArrow = await this.canvasArrowRepository.save(targetArrow);
    return this.toArrowDto(savedArrow);
  }

  async updateStage(
    updateCanvasStageDto: UpdateCanvasStageDto,
    user: User,
  ): Promise<CanvasStageDto> {
    const stageToUpdate = await this.getStageWithRelations(
      updateCanvasStageDto.id,
    );
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
    const targetStage = await this.getStageWithRelations(stageId);
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

  async removeNumpadBlock(blockId: string, user: User): Promise<boolean> {
    const targetBlock = await this.canvasNumpadBlockRepository.findOneBy({
      id: blockId,
    });
    if (!targetBlock) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }
    if (targetBlock.user.id != user.id) {
      throw new UnauthorizedException('The block not belong to this user');
    }
    const deleteResult: DeleteResult =
      await this.canvasNumpadBlockRepository.delete(blockId);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Stage with ID "${blockId}" not found`);
    }
    return true;
  }

  async removeCharacterMoveImage(
    imageId: string,
    user: User,
  ): Promise<boolean> {
    const targetImage = await this.canvasCharacterMoveImageRepository.findOneBy(
      {
        id: imageId,
      },
    );
    if (!targetImage) {
      throw new NotFoundException(`Block with ID ${imageId} not found`);
    }
    if (targetImage.user.id != user.id) {
      throw new UnauthorizedException('The block not belong to this user');
    }
    const deleteResult: DeleteResult =
      await this.canvasCharacterMoveImageRepository.delete(imageId);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Stage with ID "${imageId}" not found`);
    }
    return true;
  }

  async removeArrow(arrowId: string, user: User): Promise<boolean> {
    const targetArrow = await this.canvasArrowRepository.findOneBy({
      id: arrowId,
    });
    if (!targetArrow) {
      throw new NotFoundException(`Arrow with ID ${arrowId} not found`);
    }
    if (targetArrow.user.id != user.id) {
      throw new UnauthorizedException('The arrow not belong to this user');
    }
    const deleteResult: DeleteResult =
      await this.canvasArrowRepository.delete(arrowId);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Arrow with ID "${arrowId}" not found`);
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

  toCanvasCharacterImageDto(
    image: CanvasCharacterMoveImage,
  ): CanvasCharacterMoveImageDto {
    return plainToInstance(CanvasCharacterMoveImageDto, image, {
      excludeExtraneousValues: true,
    });
  }

  toArrowDto(arrow: CanvasArrow): CanvasArrowDto {
    return plainToInstance(CanvasArrowDto, arrow, {
      excludeExtraneousValues: true,
    });
  }
}
