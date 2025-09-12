import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
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
import { DeleteSummary } from 'src/common/dto/delete-summary.dto';
import { NODE_KIND } from 'src/common/interface';
import { SyncCanvasNumpadBlocksDto } from './dtos/numpad/sync-numpad-blocks.dto';
import { SyncCanvasCharacterMoveImagesDto } from './dtos/move_image/sync-canvas-character-move-images.dto';
import { SyncCanvasArrowsDto } from './dtos/arrow/sync-canvas-arrows.dto';
import { CanvasText } from './entities/canvas-text.entity';
import { CanvasTextDto } from './dtos/text/canvas-text.dto';
import { CreateCanvasTextDto } from './dtos/text/create-canvas-text.dto';
import { UpdateCanvasTextDto } from './dtos/text/update-canvas-text.dto';
import { SyncCanvasTextDto } from './dtos/text/sync-canvas-text.dto';

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
    @InjectRepository(CanvasText)
    private canvasTextRepository: Repository<CanvasText>,
    private characterService: CharacterService,
    private entityManager: EntityManager, // 注入 EntityManager
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

  async createNumpadBlocks(
    blocks: CreateCanvasNumpadBlockDto[], // 1. 參數改為 DTO 陣列
    user: User,
  ): Promise<CanvasNumpadBlockDto[]> { // 1. 回傳值改為 DTO 陣列
    // 如果傳入的陣列是空的，直接返回空陣列，避免不必要的資料庫查詢
    if (!blocks || blocks.length === 0) {
      return [];
    }

    // 2. 批次驗證 Stage
    // 取出所有不重複的 stageId
    const stageIds = [...new Set(blocks.map(block => block.stageId))];

    // 一次性查詢所有需要的 stage
    const stages = await this.canvasStageRepository.find({
      where: { id: In(stageIds) }, // 使用 In 運算子進行批次查詢
    });

    // 檢查是否所有 stage 都找到了
    if (stages.length !== stageIds.length) {
      const foundStageIds = new Set(stages.map(s => s.id));
      const missingStageIds = stageIds.filter(id => !foundStageIds.has(id));
      throw new NotFoundException(`Stages with IDs [${missingStageIds.join(', ')}] not found`);
    }

    // 為了方便後續查找，將 stages 陣列轉成以 ID 為 key 的 Map
    const stageMap = new Map(stages.map(stage => [stage.id, stage]));

    // 3. 批次建立 Block 實體
    const blockEntities = blocks.map(block => {
      const stage = stageMap.get(block.stageId);
      // 這個檢查理論上不會觸發，因為上面已經驗證過，但為了型別安全可以保留
      if (!stage) {
          throw new BadRequestException(`Internal error: Stage for block ${block.id} not pre-fetched.`);
      }
      return this.canvasNumpadBlockRepository.create({
        id: block.id,
        input: block.input,
        type: block.type,
        x: block.x,
        y: block.y,
        stage: stage, // 從 Map 中取得對應的 stage 實體
        user: user,
      });
    });

    // 4. 一次性儲存所有實體到資料庫
    // repository.save() 接受一個實體陣列，會將它們包在一個 transaction 中高效地插入
    const savedBlocks = await this.canvasNumpadBlockRepository.save(blockEntities);

    // 5. 將儲存後的實體陣列映射回 DTO 陣列並返回
    return savedBlocks.map(block => this.toNumpadBlockDto(block));
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
    return this.toCharacterMoveImageDto(savedImage);
  }

  async createCharacterMoveImages(
    images: CreateCanvasCharacterMoveImageDto[], // 參數改為 DTO 陣列
    user: User,
  ): Promise<CanvasCharacterMoveImageDto[]> { // 回傳值改為 DTO 陣列
    if (!images || images.length === 0) {
      return [];
    }

    // 1. 批次處理 Stage 查詢
    const stageIds = [...new Set(images.map(img => img.stageId))];
    const stages = await this.canvasStageRepository.find({
      where: { id: In(stageIds) },
    });
    if (stages.length !== stageIds.length) {
      const foundStageIds = new Set(stages.map(s => s.id));
      const missingStageIds = stageIds.filter(id => !foundStageIds.has(id));
      throw new NotFoundException(`Stages with IDs [${missingStageIds.join(', ')}] not found`);
    }
    const stageMap = new Map(stages.map(stage => [stage.id, stage]));

    // 2. 批次處理 CharacterMoveImage 查詢
    // 收集所有不重複的 fileName
    const characterMoveImageFileNames = [...new Set(images.map(img => img.characterMoveImage.fileName))];
    
    const characterMoveImages = await this.characterService.findCharacterMoveImagesByFileNames(
      characterMoveImageFileNames,
    );

    if (characterMoveImages.length !== characterMoveImageFileNames.length) {
      const foundFileNames = new Set(characterMoveImages.map(c => c.fileName));
      const missingFileNames = characterMoveImageFileNames.filter(name => !foundFileNames.has(name));
      throw new NotFoundException(`CharacterMoveImages with fileNames [${missingFileNames.join(', ')}] not found`);
    }
    const characterMoveImageMap = new Map(
      characterMoveImages.map(charImg => [charImg.fileName, charImg])
    );

    // 3. 批次建立 Entity
    const imageEntities = images.map(img => {
      const stage = stageMap.get(img.stageId);
      const targetCharacterMoveImage = characterMoveImageMap.get(img.characterMoveImage.fileName);

      // 理論上不會發生，因為前面已驗證，但為型別安全保留
      if (!stage || !targetCharacterMoveImage) {
        throw new BadRequestException(`Internal error: Dependent entities for block ${img.id} not pre-fetched.`);
      }

      return this.canvasCharacterMoveImageRepository.create({
        id: img.id,
        x: img.x,
        y: img.y,
        characterMoveImage: targetCharacterMoveImage,
        stage: stage,
        user: user,
      });
    });

    // 4. 一次性儲存所有 Entity
    const savedImages = await this.canvasCharacterMoveImageRepository.save(imageEntities);

    // 5. 批次轉換為 DTO 並回傳
    return savedImages.map(image => this.toCharacterMoveImageDto(image));
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
  
  async createArrows(
    arrows: CreateCanvasArrowDto[], // 參數改為 DTO 陣列
    user: User,
  ): Promise<CanvasArrowDto[]> { // 回傳值改為 DTO 陣列
    if (!arrows || arrows.length === 0) {
      return [];
    }

    // 1. 批次處理 Stage 查詢
    const stageIds = [...new Set(arrows.map(arrow => arrow.stageId))];
    const stages = await this.canvasStageRepository.find({
      where: { id: In(stageIds) },
    });
    if (stages.length !== stageIds.length) {
      const foundStageIds = new Set(stages.map(s => s.id));
      const missingStageIds = stageIds.filter(id => !foundStageIds.has(id));
      throw new NotFoundException(`Stages with IDs [${missingStageIds.join(', ')}] not found`);
    }
    const stageMap = new Map(stages.map(stage => [stage.id, stage]));

    // 2. 批次建立 Entity
    const arrowEntities = arrows.map(arrow => {
      const stage = stageMap.get(arrow.stageId);
      // 理論上不會發生，因為前面已驗證，但為型別安全保留
      if (!stage) {
          throw new BadRequestException(`Internal error: Stage for arrow ${arrow.id} not pre-fetched.`);
      }
      return this.canvasArrowRepository.create({
        id: arrow.id,
        startNodeId: arrow.startNodeId,
        endNodeId: arrow.endNodeId,
        points: arrow.points,
        stage: stage, // 從 Map 中取得對應的 stage 實體
        user: user,
      });
    });

    // 3. 一次性儲存所有 Entity
    const savedArrows = await this.canvasArrowRepository.save(arrowEntities);

    // 4. 批次轉換為 DTO 並回傳
    return savedArrows.map(arrow => this.toArrowDto(arrow));
  }

  async createText(
    text: CreateCanvasTextDto,
    user: User,
  ): Promise<CanvasTextDto> {
    const stage = await this.canvasStageRepository.findOne({
      where: { id: text.stageId },
    });
    if (!stage) {
      throw new NotFoundException(`Stage with ID ${text.stageId} not found`);
    } else {
      const textEntity = this.canvasTextRepository.create({
        id: text.id,
        text: text.text,
        fontColor: text.fontColor,
        backgroundColor: text.backgroundColor,
        x: text.x,
        y: text.y,
        rotation: text.rotation,
        scaleX: text.scaleX,
        scaleY: text.scaleY,
        stage: stage,
        user: user,
      });
      const savedText = await this.canvasTextRepository.save(textEntity);
      return this.toTextDto(savedText);
    }
  }

  async createTexts(
    texts: CreateCanvasTextDto[], // 參數改為 DTO 陣列
    user: User,
  ): Promise<CanvasTextDto[]> { // 回傳值改為 DTO 陣列
    if (!texts || texts.length === 0) {
      return [];
    }

    // 1. 批次處理 Stage 查詢
    const stageIds = [...new Set(texts.map(text => text.stageId))];
    const stages = await this.canvasStageRepository.find({
      where: { id: In(stageIds) },
    });
    if (stages.length !== stageIds.length) {
      const foundStageIds = new Set(stages.map(s => s.id));
      const missingStageIds = stageIds.filter(id => !foundStageIds.has(id));
      throw new NotFoundException(`Stages with IDs [${missingStageIds.join(', ')}] not found`);
    }
    const stageMap = new Map(stages.map(stage => [stage.id, stage]));

    // 2. 批次建立 Entity
    const textEntities = texts.map(text => {
      const stage = stageMap.get(text.stageId);
      // 理論上不會發生，因為前面已驗證，但為型別安全保留
      if (!stage) {
          throw new BadRequestException(`Internal error: Stage for text ${text.id} not pre-fetched.`);
      }
      return this.canvasTextRepository.create({
        id: text.id,
        text: text.text,
        fontColor: text.fontColor,
        backgroundColor: text.backgroundColor,
        x: text.x,
        y: text.y,
        rotation: text.rotation,
        scaleX: text.scaleX,
        scaleY: text.scaleY,
        stage: stage, // 從 Map 中取得對應的 stage 實體
        user: user,
      });
    });

    // 3. 一次性儲存所有 Entity
    const savedTexts = await this.canvasTextRepository.save(textEntities);

    // 4. 批次轉換為 DTO 並回傳
    return savedTexts.map(text => this.toTextDto(text));
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
    return images.map((images) => this.toCharacterMoveImageDto(images));
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

  async findAllTextsByStage(stageId: string): Promise<CanvasTextDto[]> {
    const texts = await this.canvasTextRepository.find({
      where: {
        stage: { id: stageId },
      },
    });
    return texts.map((text) => this.toTextDto(text));
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
    return this.toCharacterMoveImageDto(savedImage);
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

  async updateText(
    text: UpdateCanvasTextDto,
    user: User,
  ): Promise<CanvasTextDto> {
    const targetText = await this.canvasTextRepository.findOne({
      where: { id: text.id },
    });

    if (!targetText) {
      throw new NotFoundException(`Text with ID ${text.id} not found`);
    }

    targetText.text = text.text;
    targetText.fontColor = text.fontColor;
    targetText.backgroundColor = text.backgroundColor;
    targetText.x = text.x;
    targetText.y = text.y;
    targetText.rotation = text.rotation;
    targetText.scaleX = text.scaleX;
    targetText.scaleY = text.scaleY;

    const savedText = await this.canvasTextRepository.save(targetText);
    return this.toTextDto(savedText);
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

  async removeStage(stageId: string, user: User): Promise<DeleteSummary> {
    const targetStage = await this.getStageWithRelations(stageId);
    if (!targetStage) {
      throw new NotFoundException(`Stage with ID "${stageId}" not found`);
    } else if (targetStage.user.id != user.id) {
      throw new UnauthorizedException('The stage not belong to this user');
    }
    const deletedEntityIds:string[] = []
    const affectCharacterMoveImages = await this.canvasCharacterMoveImageRepository.find({
      where:{stage:{id:stageId}},
      select: ['id'],
    })
    
    const affectBlocks = await this.canvasNumpadBlockRepository.find({
      where:{stage:{id:stageId}},
      select: ['id'],
    })
    const affectArrows = await this.canvasArrowRepository.find({
      where:{stage:{id:stageId}},
      select: ['id'],
    })
    const affectTexts = await this.canvasTextRepository.find({
      where:{stage:{id:stageId}},
      select: ['id'],
    })
    const deleteResult = await this.canvasStageRepository.delete(stageId);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Stage with ID "${stageId}" not found for deletion (affected 0).`);
    }
    deletedEntityIds.push(stageId); 
    const characterMoveImageCheckPromises = affectCharacterMoveImages.map(async (image)=>{
      const result = await this.canvasCharacterMoveImageRepository.findOneBy({id:image.id})
      if(!result){
        deletedEntityIds.push(image.id) 
      }
      else{
        throw new InternalServerErrorException(
          `Critical Error: CharacterMoveImages with ID "${image.id}" was expected to be cascade-deleted by Stage ${stageId} but still exists. ` +
          `This indicates a potential database 'onDelete: CASCADE' misconfiguration or a database integrity issue.`
        );
      }
    })
    await Promise.all(characterMoveImageCheckPromises)
    const numpadBlockCheckPromises = affectBlocks.map(async (block)=>{
      const result = await this.canvasNumpadBlockRepository.findOneBy({id:block.id})
      if(!result){
        deletedEntityIds.push(block.id) 
      }
      else{
        throw new InternalServerErrorException(
          `Critical Error: CanvasNumpadBlock with ID "${block.id}" was expected to be cascade-deleted by Stage ${stageId} but still exists. ` +
          `This indicates a potential database 'onDelete: CASCADE' misconfiguration or a database integrity issue.`
        );
      }
    })
    await Promise.all(numpadBlockCheckPromises)
    const arrowCheckPromises = affectArrows.map(async (arrow)=>{
      const result = await this.canvasArrowRepository.findOneBy({id:arrow.id})
      if(!result){
        deletedEntityIds.push(arrow.id) 
      }
      else{
        throw new InternalServerErrorException(
          `Critical Error: canvasArrow with ID "${arrow.id}" was expected to be cascade-deleted by Stage ${stageId} but still exists. ` +
          `This indicates a potential database 'onDelete: CASCADE' misconfiguration or a database integrity issue.`
        );
      }
    })
    await Promise.all(arrowCheckPromises)
    const textCheckPromises = affectTexts.map(async (text)=>{
      const result = await this.canvasTextRepository.findOneBy({id:text.id})
      if(!result){
        deletedEntityIds.push(text.id) 
      }
      else{
        throw new InternalServerErrorException(
          `Critical Error: CanvasText with ID "${text.id}" was expected to be cascade-deleted by Stage ${stageId} but still exists. ` +
          `This indicates a potential database 'onDelete: CASCADE' misconfiguration or a database integrity issue.`
        );
      }
    })
    await Promise.all(textCheckPromises)
    return {
      ok:true,
      deletedEntityIds: deletedEntityIds
    }
  }

  async removeNumpadBlock(blockId: string, user: User): Promise<DeleteSummary> {
    const targetBlock = await this.canvasNumpadBlockRepository.findOneBy({
      id: blockId,
    });
    if (!targetBlock) {
      throw new NotFoundException(`Block with ID ${blockId} not found`);
    }
    if (targetBlock.user.id != user.id) {
      throw new UnauthorizedException('The block not belong to this user');
    }
    await this.canvasNumpadBlockRepository.delete(blockId);
    const deletedEntityIds: string[] = [blockId];
    return {
      ok: true,
      deletedEntityIds:deletedEntityIds
    };
  }

  async removeCharacterMoveImage(
    imageId: string,
    user: User,
  ): Promise<DeleteSummary> {
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
    return {
      ok:true,
      deletedEntityIds: [imageId]
    };
  }

  async removeArrow(arrowId: string, user: User): Promise<DeleteSummary> {
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
    return {
      ok:true,
      deletedEntityIds:[arrowId]
    };
  }

  async removeText(textId: string, user: User): Promise<DeleteSummary> {
    const targetText = await this.canvasTextRepository.findOneBy({
      id: textId,
    });
    if (!targetText) {
      throw new NotFoundException(`Text with ID ${textId} not found`);
    }
    if (targetText.user.id != user.id) {
      throw new UnauthorizedException('The text not belong to this user');
    }
    const deleteResult: DeleteResult =
      await this.canvasTextRepository.delete(textId);
    if (deleteResult.affected === 0) {
      throw new NotFoundException(`Text with ID "${textId}" not found`);
    }
    return {
      ok:true,
      deletedEntityIds:[textId]
    };
  }

  async removeNumpadBlocksByStageId(stageId: string, user:User): Promise<DeleteSummary>{
    const targetBlocks = await this.canvasNumpadBlockRepository.find({
      where:{stage:{id:stageId}},
      select:['id']
    })
    if (!targetBlocks) {
      throw new NotFoundException(`Blocks with stage ID ${stageId} not found`);
    }
    if (targetBlocks[0].user.id != user.id) {
      throw new UnauthorizedException('The Block not belong to this user');
    }
    const deletedEntityIds = targetBlocks.map((block) => block.id)
    await this.canvasNumpadBlockRepository.delete({id:In(deletedEntityIds)})
    return {
      ok: true,
      deletedEntityIds: deletedEntityIds
    }
  }

  async removeCharacterMoveImageByStageId(stageId: string, user:User): Promise<DeleteSummary>{
    const targetCharacterMoveImage = await this.canvasCharacterMoveImageRepository.find({
      where:{stage:{id:stageId}},
      select:['id']
    })
    if (!targetCharacterMoveImage) {
      throw new NotFoundException(`CharacterMoveImage with stage ID ${stageId} not found`);
    }
    if (targetCharacterMoveImage[0].user.id != user.id) {
      throw new UnauthorizedException('The CharacterMoveImage not belong to this user');
    }
    const deletedEntityIds = targetCharacterMoveImage.map((block) => block.id)
    await this.canvasCharacterMoveImageRepository.delete({id:In(deletedEntityIds)})
    return {
      ok: true,
      deletedEntityIds: deletedEntityIds
    }
  }

  async removeArrowByStageId(stageId: string, user:User): Promise<DeleteSummary>{
    const targetArrows = await this.canvasArrowRepository.find({
      where:{stage:{id:stageId}},
      select:['id']
    })
    if (!targetArrows) {
      throw new NotFoundException(`Arrow with stage ID ${stageId} not found`);
    }
    if (targetArrows[0].user.id != user.id) {
      throw new UnauthorizedException('The Arrow not belong to this user');
    }
    const deletedEntityIds = targetArrows.map((block) => block.id)
    await this.canvasArrowRepository.delete({id:In(deletedEntityIds)})
    return {
      ok: true,
      deletedEntityIds: deletedEntityIds
    }
  }

  async removeTextsByStageId(stageId: string, user:User): Promise<DeleteSummary>{
    const targetTexts = await this.canvasTextRepository.find({
      where:{stage:{id:stageId}},
      select:['id']
    })
    if (!targetTexts) {
      throw new NotFoundException(`Texts with stage ID ${stageId} not found`);
    }
    if (targetTexts[0].user.id != user.id) {
      throw new UnauthorizedException('The Texts not belong to this user');
    }
    const deletedEntityIds = targetTexts.map((text) => text.id)
    await this.canvasTextRepository.delete({id:In(deletedEntityIds)})
    return {
      ok: true,
      deletedEntityIds: deletedEntityIds
    }
  }

  /**
   * 同步指定 Stage 的所有 NumpadBlock
   * 此操作在一個資料庫交易中完成，確保資料一致性。
   * @param syncDto 包含 stageId 和新的 blocks 陣列
   * @param user 當前操作的使用者
   * @returns 返回新創建的 NumpadBlock DTO 陣列
   */
  async syncNumpadBlocks(
    syncDto: SyncCanvasNumpadBlocksDto,
    user: User,
  ): Promise<CanvasNumpadBlockDto[]> {
    const { stageId, blocks } = syncDto;

    // 使用 entityManager.transaction 來執行原子操作
    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        // 步驟 1: 驗證 Stage 是否存在且屬於該使用者
        // 在交易中，所有查詢都應該使用 transactionalEntityManager
        const stage = await transactionalEntityManager.findOne(CanvasStage, {
          where: { id: stageId },
          relations: ['user'],
        });

        if (!stage) {
          throw new NotFoundException(`Stage with ID ${stageId} not found`);
        }
        if (stage.user.id !== user.id) {
          throw new UnauthorizedException(
            'You do not have permission to modify this stage.',
          );
        }

        // 步驟 2: 刪除該 Stage 底下所有舊的 NumpadBlock
        // 使用 transactionalEntityManager 執行刪除操作
        await transactionalEntityManager.delete(CanvasNumpadBlock, {
          stage: { id: stageId },
        });

        // 如果前端傳來的 blocks 陣列是空的，那麼操作到此結束（相當於清空）
        if (!blocks || blocks.length === 0) {
          return [];
        }

        // 步驟 3: 創建新的 NumpadBlock 實體
        const newBlockEntities = blocks.map((blockDto) => {
          // 不再需要從 DTO 陣列中查詢 stage，因為我們已經在交易開始時驗證過了
          return transactionalEntityManager.create(CanvasNumpadBlock, {
            ...blockDto,
            stage: stage, // 直接使用已查詢到的 stage 實體
            user: user,
          });
        });

        // 步驟 4: 一次性儲存所有新的實體
        // 使用 transactionalEntityManager 執行保存操作
        const savedBlocks = await transactionalEntityManager.save(
          CanvasNumpadBlock,
          newBlockEntities,
        );
        
        // 如果任何步驟失敗 (例如資料庫約束錯誤)，TypeORM 會自動拋出錯誤
        // transactionalEntityManager 會捕捉到錯誤並自動回滾所有操作 (包括上面的刪除)

        // 步驟 5: 將儲存後的實體轉換為 DTO 並返回
        return savedBlocks.map((block) => this.toNumpadBlockDto(block));
      },
    );
  }

  /**
   * 同步指定 Stage 的所有 CharacterMoveImage
   * 此操作在一個資料庫交易中完成，確保資料一致性。
   * @param syncDto 包含 stageId 和新的 characterMoveImages 陣列
   * @param user 當前操作的使用者
   * @returns 返回新創建的 CharacterMoveImage DTO 陣列
   */
  async syncCharacterMoveImages(
    syncDto: SyncCanvasCharacterMoveImagesDto,
    user: User,
  ): Promise<CanvasCharacterMoveImageDto[]> {
    const { stageId, characterMoveImages } = syncDto;

    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        // 步驟 1: 驗證 Stage 是否存在且屬於該使用者
        const stage = await transactionalEntityManager.findOne(CanvasStage, {
          where: { id: stageId },
          relations: ['user'],
        });

        if (!stage) {
          throw new NotFoundException(`Stage with ID ${stageId} not found`);
        }
        if (stage.user.id !== user.id) {
          throw new UnauthorizedException(
            'You do not have permission to modify this stage.',
          );
        }

        // 步驟 2: 刪除該 Stage 底下所有舊的 CharacterMoveImage
        await transactionalEntityManager.delete(CanvasCharacterMoveImage, {
          stage: { id: stageId },
        });

        // 如果前端傳來的 characterMoveImages 陣列是空的，那麼操作到此結束（相當於清空）
        if (!characterMoveImages || characterMoveImages.length === 0) {
          return [];
        }

        // 步驟 3: 批次查詢所需的 CharacterMoveImage 實體
        const characterMoveImageFileNames = [...new Set(characterMoveImages.map(img => img.characterMoveImage.fileName))];
        const characterMoveImagesFromDB = await this.characterService.findCharacterMoveImagesByFileNames(
          characterMoveImageFileNames,
        );

        if (characterMoveImagesFromDB.length !== characterMoveImageFileNames.length) {
          const foundFileNames = new Set(characterMoveImagesFromDB.map(c => c.fileName));
          const missingFileNames = characterMoveImageFileNames.filter(name => !foundFileNames.has(name));
          throw new NotFoundException(`CharacterMoveImages with fileNames [${missingFileNames.join(', ')}] not found`);
        }

        const characterMoveImageMap = new Map(
          characterMoveImagesFromDB.map(charImg => [charImg.fileName, charImg])
        );

        // 步驟 4: 創建新的 CharacterMoveImage 實體
        const newImageEntities = characterMoveImages.map((imageDto) => {
          const targetCharacterMoveImage = characterMoveImageMap.get(imageDto.characterMoveImage.fileName);
          
          if (!targetCharacterMoveImage) {
            throw new BadRequestException(`CharacterMoveImage with fileName ${imageDto.characterMoveImage.fileName} not found`);
          }

          return transactionalEntityManager.create(CanvasCharacterMoveImage, {
            ...imageDto,
            characterMoveImage: targetCharacterMoveImage,
            stage: stage,
            user: user,
          });
        });

        // 步驟 5: 一次性儲存所有新的實體
        const savedImages = await transactionalEntityManager.save(
          CanvasCharacterMoveImage,
          newImageEntities,
        );

        // 步驟 6: 將儲存後的實體轉換為 DTO 並返回
        return savedImages.map((image) => this.toCharacterMoveImageDto(image));
      },
    );
  }

  /**
   * 同步指定 Stage 的所有 Arrow
   * 此操作在一個資料庫交易中完成，確保資料一致性。
   * @param syncDto 包含 stageId 和新的 arrows 陣列
   * @param user 當前操作的使用者
   * @returns 返回新創建的 Arrow DTO 陣列
   */
  async syncArrows(
    syncDto: SyncCanvasArrowsDto,
    user: User,
  ): Promise<CanvasArrowDto[]> {
    const { stageId, arrows } = syncDto;

    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        // 步驟 1: 驗證 Stage 是否存在且屬於該使用者
        const stage = await transactionalEntityManager.findOne(CanvasStage, {
          where: { id: stageId },
          relations: ['user'],
        });

        if (!stage) {
          throw new NotFoundException(`Stage with ID ${stageId} not found`);
        }
        if (stage.user.id !== user.id) {
          throw new UnauthorizedException(
            'You do not have permission to modify this stage.',
          );
        }

        // 步驟 2: 刪除該 Stage 底下所有舊的 Arrow
        await transactionalEntityManager.delete(CanvasArrow, {
          stage: { id: stageId },
        });

        // 如果前端傳來的 arrows 陣列是空的，那麼操作到此結束（相當於清空）
        if (!arrows || arrows.length === 0) {
          return [];
        }

        // 步驟 3: 創建新的 Arrow 實體
        const newArrowEntities = arrows.map((arrowDto) => {
          return transactionalEntityManager.create(CanvasArrow, {
            ...arrowDto,
            stage: stage,
            user: user,
          });
        });

        // 步驟 4: 一次性儲存所有新的實體
        const savedArrows = await transactionalEntityManager.save(
          CanvasArrow,
          newArrowEntities,
        );

        // 步驟 5: 將儲存後的實體轉換為 DTO 並返回
        return savedArrows.map((arrow) => this.toArrowDto(arrow));
      },
    );
  }

  /**
   * 同步指定 Stage 的所有 Text
   * 此操作在一個資料庫交易中完成，確保資料一致性。
   * @param syncDto 包含 stageId 和新的 texts 陣列
   * @param user 當前操作的使用者
   * @returns 返回新創建的 Text DTO 陣列
   */
  async syncTexts(
    syncDto: SyncCanvasTextDto,
    user: User,
  ): Promise<CanvasTextDto[]> {
    const { stageId, texts } = syncDto;

    return this.entityManager.transaction(
      async (transactionalEntityManager) => {
        // 步驟 1: 驗證 Stage 是否存在且屬於該使用者
        const stage = await transactionalEntityManager.findOne(CanvasStage, {
          where: { id: stageId },
          relations: ['user'],
        });

        if (!stage) {
          throw new NotFoundException(`Stage with ID ${stageId} not found`);
        }
        if (stage.user.id !== user.id) {
          throw new UnauthorizedException(
            'You do not have permission to modify this stage.',
          );
        }

        // 步驟 2: 刪除該 Stage 底下所有舊的 Text
        await transactionalEntityManager.delete(CanvasText, {
          stage: { id: stageId },
        });

        // 如果前端傳來的 texts 陣列是空的，那麼操作到此結束（相當於清空）
        if (!texts || texts.length === 0) {
          return [];
        }

        // 步驟 3: 創建新的 Text 實體
        const newTextEntities = texts.map((textDto) => {
          return transactionalEntityManager.create(CanvasText, {
            ...textDto,
            stage: stage,
            user: user,
          });
        });

        // 步驟 4: 一次性儲存所有新的實體
        const savedTexts = await transactionalEntityManager.save(
          CanvasText,
          newTextEntities,
        );

        // 步驟 5: 將儲存後的實體轉換為 DTO 並返回
        return savedTexts.map((text) => this.toTextDto(text));
      },
    );
  }

  toStageDto(stage: CanvasStage): CanvasStageDto {
    return plainToInstance(CanvasStageDto, stage, {
      excludeExtraneousValues: true,
    });
  }

  toNumpadBlockDto(numpadBlock: CanvasNumpadBlock): CanvasNumpadBlockDto {
    const dto= plainToInstance(CanvasNumpadBlockDto, numpadBlock, {
      excludeExtraneousValues: true,
    });
    dto.kind = NODE_KIND.NUMPAD_BLOCK
    return dto
  }

  toCharacterMoveImageDto(
    image: CanvasCharacterMoveImage,
  ): CanvasCharacterMoveImageDto {
    const dto = plainToInstance(CanvasCharacterMoveImageDto, image, {
      excludeExtraneousValues: true,
    });
    dto.kind = NODE_KIND.CHARACTER_MOVE_IMAGE
    return dto
  }

  toArrowDto(arrow: CanvasArrow): CanvasArrowDto {
    const dto =  plainToInstance(CanvasArrowDto, arrow, {
      excludeExtraneousValues: true,
    });
    // TODO 應該改成資料庫都有KIND比較好?
    dto.kind = NODE_KIND.ARROW
    return dto
  }

  toTextDto(text: CanvasText): CanvasTextDto {
    const dto = plainToInstance(CanvasTextDto, text, {
      excludeExtraneousValues: true,
    });
    dto.kind = NODE_KIND.TEXT
    return dto
  }
}
