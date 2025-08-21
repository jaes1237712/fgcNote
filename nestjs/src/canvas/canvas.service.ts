import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CanvasNumpadBlock } from './entities/canvas-numpad-block.entity';
import { CanvasNumpadBlockDto } from './dtos/numpad/canvas-numpad-block.dto';
import {CreateCanvasNumpadBlockDto} from './dtos/numpad/create-canvas-numpad-block.dto'
import {} from './entities/canvas-character-move-image.entity';
import {} from './dtos/move_image/canvas-character-move-image.dto';
import { CanvasStage } from './entities/canvas-stage.entity';
import { CanvasStageDto } from './dtos/stage/canvas-stage.dto';
import { CreateCanvasStageDto } from './dtos/stage/create-canvas-stage.dto';
import { plainToInstance } from 'class-transformer';
import { User } from 'src/user/entities/user.entity';
import { Character } from 'src/character/entities/character.entity';
import { UpdateCanvasStageDto } from './dtos/stage/update-canvas-stage.dto';
import { DeleteResult } from 'typeorm/browser';
import { CharacterService } from 'src/character/character.service';
import { UpdateCanvasNumpadBlockDto } from './dtos/numpad/update-canvas-numpad-block.dto';

@Injectable()
export class CanvasService {
  constructor(
    @InjectRepository(CanvasNumpadBlock)
    private canvasNumpadBlockRepository: Repository<CanvasNumpadBlock>,
    @InjectRepository(CanvasStage)
    private canvasStageRepository: Repository<CanvasStage>,
    private characterService: CharacterService, // <--- **注入 CharacterService**
  ) {}

  async getStageWithRelations(stageId: string): Promise<CanvasStage | null> {
    const stage = await this.canvasStageRepository.findOne({
      where: { id: stageId },
      relations: ['numpadBlocks'],
    });
    return stage;
  }

  async findAllStage(user: User): Promise<CanvasStageDto[]> {
    const stages = await this.canvasStageRepository.find({
      where: {
        user: {id:user.id},
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

  async updateNumpadBlock(
    block: UpdateCanvasNumpadBlockDto,
    user: User,
  ): Promise<CanvasNumpadBlockDto>{
    const stage = await this.canvasStageRepository.findOne({where:{id:block.stageId}})
    const targetBlock = await this.canvasNumpadBlockRepository.findOne({where:{id:block.id}})
    
    if(!stage){
      throw new NotFoundException(`Stage with ID ${block.stageId} not found`)
    }
    if(!targetBlock){
      throw new NotFoundException(`Block with ID ${block.id} not found`)
    }
    if(user.id !== stage.user.id){
      throw new UnauthorizedException("Stage don't belong to this user.")
    }

    // 3. Update the properties of the found entity
    targetBlock.input = block.input;
    targetBlock.type = block.type;
    targetBlock.x = block.x;
    targetBlock.y = block.y;
    // Assign the found stage entity to the block's stage relationship
    targetBlock.stage = stage;
    const savedBlock = await this.canvasNumpadBlockRepository.save(targetBlock);
    return this.toNumpadBlockDto(savedBlock);
    
  }

  async createNumpadBlock(
    block: CreateCanvasNumpadBlockDto,
    user: User,
  ): Promise<CanvasNumpadBlockDto>{
    const stage = await this.canvasStageRepository.findOne({where:{id:block.stageId}})
    if(!stage){
      throw new NotFoundException(`Stage with ID ${block.stageId} not found`)
    }
    else{
      const blockEntity = this.canvasNumpadBlockRepository.create({
        id: block.id,
        input: block.input,
        type: block.type,
        x:block.x,
        y: block.y,
        stage:stage,
        user:user
      });
      const savedBlock = await this.canvasNumpadBlockRepository.save(blockEntity);
      return this.toNumpadBlockDto(savedBlock);
    }
  }

  async createStage(
    stage: CreateCanvasStageDto,
    user: User,
  ): Promise<CanvasStageDto> {
    const characterMe = await this.characterService.findCharacter(stage.characterMe.id)
    if (!characterMe) {
      throw new NotFoundException(
        `Character with ID ${stage.characterMe.id} not found.`,
      );
    }

    const characterOpponent = await this.characterService.findCharacter(stage.characterOpponent.id);
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
    const stageToUpdate = await this.getStageWithRelations(updateCanvasStageDto.id)
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

  async removeNumpadBlock(blockId: string, user: User): Promise<boolean>{
    const targetBlock = await this.canvasNumpadBlockRepository.findOneBy({
      id:blockId
    })
    if(!targetBlock){
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }
    if (targetBlock.user.id != user.id) {
      throw new UnauthorizedException('The block not belong to this user');
    }
    const deleteResult: DeleteResult = await this.canvasNumpadBlockRepository.delete(blockId);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Stage with ID "${blockId}" not found`);
    }
    return true;
  }

  async removeStage(stageId: string, user: User): Promise<boolean> {
    const targetStage = await this.getStageWithRelations(stageId)
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
