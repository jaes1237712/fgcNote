import {
  Controller,
  Get,
  Param,
  UseGuards,
  Req,
  Post,
  ParseUUIDPipe,
  Body,
  UnauthorizedException,
  Delete,
  Patch,
  BadRequestException,
  Put,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CanvasService} from './canvas.service';
import { CanvasNumpadBlockDto } from './dtos/numpad/canvas-numpad-block.dto';
import { CanvasStageDto } from './dtos/stage/canvas-stage.dto';
import { SessionGuard } from 'src/common/session.guard';
import { CreateCanvasStageDto } from './dtos/stage/create-canvas-stage.dto';
import { UpdateCanvasStageDto } from './dtos/stage/update-canvas-stage.dto';
import { CreateCanvasNumpadBlockDto } from './dtos/numpad/create-canvas-numpad-block.dto';
import { UpdateCanvasNumpadBlockDto } from './dtos/numpad/update-canvas-numpad-block.dto';
import { CanvasCharacterMoveImageDto } from './dtos/move_image/canvas-character-move-image.dto';
import { CreateCanvasCharacterMoveImageDto } from './dtos/move_image/create-canvas-character-move-image.dto';
import { UpdateCanvasCharacterMoveImageDto } from './dtos/move_image/update-canvas-character-move-image.dto';
import { CanvasArrowDto } from './dtos/arrow/canvas-arrow.dto';
import { CreateCanvasArrowDto } from './dtos/arrow/create-arrow.dto';
import { UpdateCanvasArrowDto } from './dtos/arrow/update-arrow.dto';
import { DeleteSummary } from 'src/common/dto/delete-summary.dto';
import { SyncCanvasNumpadBlocksDto } from './dtos/numpad/sync-numpad-blocks.dto';
import { SyncCanvasCharacterMoveImagesDto } from './dtos/move_image/sync-canvas-character-move-images.dto';
import { SyncCanvasArrowsDto } from './dtos/arrow/sync-canvas-arrows.dto';

@ApiTags('canvas')
@Controller('canvas')
export class CanvasController {
  constructor(private readonly canvasService: CanvasService) {}

  @Get('stage')
  @ApiOperation({
    description: 'Get all stage of certain user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully get all stage',
    type: CanvasStageDto, // 指定陣列中每個元素的類型
    isArray: true,
  })
  @UseGuards(SessionGuard)
  async getAllStage(@Req() req: Request): Promise<CanvasStageDto[]> {
    if (req.user) {
      const resp = await this.canvasService.findAllStage(req.user);
      return resp;
    } else {
      return [];
    }
  }

  @Get('numpadBlock/get/:stageId')
  @ApiOperation({
    description: 'Get all blocks of certain stage',
  })
  @ApiParam({
    name: 'stageId',
    description: 'UUID of stage',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully get all blocks',
    type: CanvasNumpadBlockDto,
    isArray: true,
  })
  async findAllBlocks(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<CanvasNumpadBlockDto[]> {
    return this.canvasService.findAllNumpadBlocksByStage(stageId);
  }

  @Get('characterMoveImage/get/:stageId')
  @ApiOperation({
    description: 'Get all characterMoveImage of certain stage',
  })
  @ApiParam({
    name: 'stageId',
    description: 'UUID of stage',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully get all characterMoveImages',
    type: CanvasCharacterMoveImageDto,
    isArray: true,
  })
  async findAllCharacterMoveImages(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<CanvasCharacterMoveImageDto[]> {
    return this.canvasService.findAllCharacterMoveImageByStage(stageId);
  }

  @Get('arrow/get/:stageId')
  @ApiOperation({
    description: 'Get all arrows of certain stage',
  })
  @ApiParam({
    name: 'stageId',
    description: 'UUID of stage',
    type: 'string',
    format: 'uuid',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully get all arrows',
    type: CanvasArrowDto,
    isArray: true,
  })
  async findAllArrows(
    @Param('stageId', ParseUUIDPipe) stageId: string,
  ): Promise<CanvasArrowDto[]> {
    return this.canvasService.findAllArrowsByStage(stageId);
  }

  @Post('numpadBlock/create')
  @ApiOperation({
    summary: 'Create Numpad Block',
  })
  @ApiResponse({
    status: 200,
    description: 'Create Numpad Block Successfully',
    type: CanvasNumpadBlockDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async createNumpadBlock(
    @Body() body: CreateCanvasNumpadBlockDto,
    @Req() req: Request,
  ): Promise<CanvasNumpadBlockDto> {
    if (req.user) {
      return this.canvasService.createNumpadBlock(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Post('numpadBlocks/bulk-create') // 新的 URL 路徑，使用複數和 bulk-create
  @ApiOperation({
    summary: 'Create multiple Numpad Blocks', // 清晰的 summary
    description: 'Creates multiple Numpad Blocks in a single request.',
  })
  @ApiBody({
    type: CreateCanvasNumpadBlockDto, // 指定陣列中每個元素的類型
    isArray: true, 
  })
  @ApiResponse({
    status: 200,
    description: 'Numpad Blocks created successfully',
    type: CanvasNumpadBlockDto,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more stages not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., empty array provided)',
  })
  @UseGuards(SessionGuard)
  async createNumpadBlocks(
    @Body() body: CreateCanvasNumpadBlockDto[], // 接受 DTO 陣列
    @Req() req: Request,
  ): Promise<CanvasNumpadBlockDto[]> {
    if (!body || body.length === 0) {
      throw new BadRequestException('Request body must not be empty.');
    }
    if (req.user) {
      return this.canvasService.createNumpadBlocks(body, req.user); // 直接呼叫批次服務方法
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Post('characterMoveImage/create')
  @ApiOperation({
    summary: 'Create characterMoveImage',
  })
  @ApiResponse({
    status: 200,
    description: 'Create characterMoveImage Successfully',
    type: CanvasCharacterMoveImageDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async createCharacterMoveImage(
    @Body() body: CreateCanvasCharacterMoveImageDto,
    @Req() req: Request,
  ): Promise<CanvasCharacterMoveImageDto> {
    if (req.user) {
      return this.canvasService.createCharacterMoveImage(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Post('characterMoveImage/bulk-create') // 新的 URL 路徑，使用複數和 bulk-create
  @ApiOperation({
    summary: 'Create multiple characterMoveImages', // 清晰的 summary
    description: 'Creates multiple characterMoveImages in a single request.',
  })
  @ApiBody({
    type: CreateCanvasCharacterMoveImageDto, // 指定陣列中每個元素的類型
    isArray: true, 
    description: 'An array of characterMoveImages DTO.', // 可選的描述
  })
  @ApiResponse({
    status: 200,
    description: 'characterMoveImages created successfully',
    type: CanvasCharacterMoveImageDto,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more stages not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., empty array provided)',
  })
  @UseGuards(SessionGuard)
  async createCharacterMoveImages(
    @Body() body: CreateCanvasCharacterMoveImageDto[], // 接受 DTO 陣列
    @Req() req: Request,
  ): Promise<CanvasCharacterMoveImageDto[]> {
    if (!body || body.length === 0) {
      throw new BadRequestException('Request body must not be empty.');
    }
    if (req.user) {
      return this.canvasService.createCharacterMoveImages(body, req.user); // 直接呼叫批次服務方法
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Post('arrow/create')
  @ApiOperation({
    summary: 'Create arrow',
  })
  @ApiResponse({
    status: 200,
    description: 'Create arrow Successfully',
    type: CanvasArrowDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async createArrow(
    @Body() body: CreateCanvasArrowDto,
    @Req() req: Request,
  ): Promise<CanvasArrowDto> {
    if (req.user) {
      return this.canvasService.createArrow(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Post('arrow/bulk-create') // 新的 URL 路徑，使用複數和 bulk-create
  @ApiOperation({
    summary: 'Create multiple arrows', // 清晰的 summary
    description: 'Creates multiple arrows in a single request.',
  })
  @ApiBody({
    type: CreateCanvasArrowDto, // 指定陣列中每個元素的類型
    isArray: true, 
    description: 'An array of CreateArrow DTO.', // 可選的描述
  })
  @ApiResponse({
    status: 200,
    description: 'arrows created successfully',
    type: CanvasArrowDto,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'One or more stages not found',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request (e.g., empty array provided)',
  })
  @UseGuards(SessionGuard)
  async createArrows(
    @Body() body: CreateCanvasArrowDto[], // 接受 DTO 陣列
    @Req() req: Request,
  ): Promise<CanvasArrowDto[]> {
    if (!body || body.length === 0) {
      throw new BadRequestException('Request body must not be empty.');
    }
    if (req.user) {
      return this.canvasService.createArrows(body, req.user); // 直接呼叫批次服務方法
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Post('stage/create')
  @ApiOperation({
    summary: 'Create Stage',
  })
  @ApiResponse({
    status: 200,
    description: 'Create Stage Successfully',
    type: CanvasStageDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async createStage(
    @Body() body: CreateCanvasStageDto,
    @Req() req: Request,
  ): Promise<CanvasStageDto> {
    if (req.user) {
      return this.canvasService.createStage(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Patch('stage/update')
  @ApiOperation({
    summary: 'Update Stage',
  })
  @ApiResponse({
    status: 200,
    description: 'Update Stage Successfully',
    type: CanvasStageDto,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async updateStage(
    @Body() body: UpdateCanvasStageDto,
    @Req() req: Request,
  ): Promise<CanvasStageDto> {
    if (req.user) {
      return this.canvasService.updateStage(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Patch('numpadBlock/update')
  @ApiOperation({
    summary: 'Update numpadBlock',
  })
  @ApiResponse({
    status: 200,
    description: 'Update numpadBlock Successfully',
    type: CanvasNumpadBlockDto,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async updateNumpadBlock(
    @Body() body: UpdateCanvasNumpadBlockDto,
    @Req() req: Request,
  ): Promise<CanvasNumpadBlockDto> {
    if (req.user) {
      return this.canvasService.updateNumpadBlock(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Patch('characterMoveImage/update')
  @ApiOperation({
    summary: 'Update characterMoveImage',
  })
  @ApiResponse({
    status: 200,
    description: 'Update characterMoveImage Successfully',
    type: CanvasCharacterMoveImageDto,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async updateCharacterMoveImage(
    @Body() body: UpdateCanvasCharacterMoveImageDto,
    @Req() req: Request,
  ): Promise<CanvasCharacterMoveImageDto> {
    if (req.user) {
      return this.canvasService.updateCharacterMoveImage(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Patch('arrow/update')
  @ApiOperation({
    summary: 'Update arrow',
  })
  @ApiResponse({
    status: 200,
    description: 'Update arrow Successfully',
    type: CanvasArrowDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async updateArrow(
    @Body() body: UpdateCanvasArrowDto,
    @Req() req: Request,
  ): Promise<CanvasArrowDto> {
    if (req.user) {
      return this.canvasService.updateArrow(body, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Delete('stage/delete/:stageId')
  @ApiOperation({
    description: 'Delete Certain stage',
  })
  @ApiParam({
    name: 'stageId',
    description: 'UUID of stage',
    type: 'string',
    format: 'uuidV4',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully delete stage',
    type: DeleteSummary,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Req() req: Request,
  ): Promise<DeleteSummary> {
    if (req.user) {
      return this.canvasService.removeStage(stageId, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Delete('numpadBlock/delete/:blockId')
  @ApiOperation({
    description: 'Delete Certain block',
  })
  @ApiParam({
    name: 'blockId',
    description: 'UUID of block',
    type: 'string',
    format: 'uuidV4',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully delete block',
    type: DeleteSummary,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteNumpadBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Req() req: Request,
  ): Promise<DeleteSummary> {
    if (req.user) {
      return this.canvasService.removeNumpadBlock(blockId, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Delete('numpadBlock/delete/:stageId')
  @ApiOperation({
    description: 'Delete All NumpadBlocks belong to this stage',
  })
  @ApiParam({
    name: 'stageId',
    description: 'UUID of stage',
    type: 'string',
    format: 'uuidV4',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully delete NumpadBlocks by stageId',
    type: DeleteSummary,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteNumpadBlocksByStageId(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Req() req: Request,
  ): Promise<DeleteSummary> {
    if (req.user) {
      return this.canvasService.removeNumpadBlocksByStageId(stageId, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Delete('characterMoveImage/delete/:canvasCharacterMoveImageID')
  @ApiOperation({
    description: 'Delete Certain CanvasCharacterMoveImage',
  })
  @ApiParam({
    name: 'canvasCharacterMoveImageID',
    type: 'string',
    format: 'uuidV4',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully delete CanvasCharacterMoveImage',
    type: DeleteSummary,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteCharacterMoveImage(
    @Param('canvasCharacterMoveImageID', ParseUUIDPipe)
    canvasCharacterMoveImageID: string,
    @Req() req: Request,
  ): Promise<DeleteSummary> {
    if (req.user) {
      return this.canvasService.removeCharacterMoveImage(
        canvasCharacterMoveImageID,
        req.user,
      );
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Delete('characterMoveImage/delete/:stageId')
  @ApiOperation({
    description: 'Delete All CharacterMoveImages belong to this stage',
  })
  @ApiParam({
    name: 'stageId',
    description: 'UUID of stage',
    type: 'string',
    format: 'uuidV4',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully delete characterMoveImage',
    type: DeleteSummary,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteCharacterMoveImagesByStageId(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Req() req: Request,
  ): Promise<DeleteSummary> {
    if (req.user) {
      return this.canvasService.removeCharacterMoveImageByStageId(stageId, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }


  @Delete('arrow/delete/:arrowId')
  @ApiOperation({
    description: 'Delete Certain arrow',
  })
  @ApiParam({
    name: 'arrowId',
    description: 'UUID of arrow',
    type: 'string',
    format: 'uuidV4',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully delete arrow',
    type: DeleteSummary,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteArrow(
    @Param('arrowId', ParseUUIDPipe) arrowId: string,
    @Req() req: Request,
  ): Promise<DeleteSummary> {
    if (req.user) {
      return this.canvasService.removeArrow(arrowId, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Delete('arrow/delete/:stageId')
  @ApiOperation({
    description: 'Delete All arrow belong to this stage',
  })
  @ApiParam({
    name: 'stageId',
    description: 'UUID of stage',
    type: 'string',
    format: 'uuidV4',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully delete arrows',
    type: DeleteSummary,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteArrowByStageId(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Req() req: Request,
  ): Promise<DeleteSummary> {
    if (req.user) {
      return this.canvasService.removeArrowByStageId(stageId, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Put('numpadBlock/sync')
  @ApiBody({
    type: SyncCanvasNumpadBlocksDto
  })
  @ApiResponse({
    status: 200,
    description: 'Numpad Blocks sync successfully',
    type: CanvasNumpadBlockDto,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Stage not found',
  })
  @UseGuards(SessionGuard)
  async syncNumpadBlocks(
    @Body() syncDto: SyncCanvasNumpadBlocksDto,
    @Req() req: Request,
  ):Promise<CanvasNumpadBlockDto[]>{
    if(req.user){
      return this.canvasService.syncNumpadBlocks(syncDto, req.user);
    }else{
      throw new UnauthorizedException('User not logged in or session expired.');
    }
    
  }

  @Put('characterMoveImage/sync')
  @ApiBody({
    type: SyncCanvasCharacterMoveImagesDto
  })
  @ApiResponse({
    status: 200,
    description: 'Character Move Images sync successfully',
    type: CanvasCharacterMoveImageDto,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Stage not found',
  })
  @UseGuards(SessionGuard)
  async syncCharacterMoveImages(
    @Body() syncDto: SyncCanvasCharacterMoveImagesDto,
    @Req() req: Request,
  ):Promise<CanvasCharacterMoveImageDto[]> {
    if(req.user){
      return this.canvasService.syncCharacterMoveImages(syncDto, req.user);
    }else{
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }

  @Put('arrow/sync')
  @ApiBody({
    type: SyncCanvasArrowsDto
  })
  @ApiResponse({
    status: 200,
    description: 'Arrows sync successfully',
    type: CanvasArrowDto,
    isArray: true
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Stage not found',
  })
  @UseGuards(SessionGuard)
  async syncArrows(
    @Body() syncDto: SyncCanvasArrowsDto,
    @Req() req: Request,
  ) :Promise<CanvasArrowDto[]>{
    if(req.user){
      return this.canvasService.syncArrows(syncDto, req.user);
    }else{
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }
}
