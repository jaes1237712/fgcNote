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
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CanvasService } from './canvas.service';
import { CanvasNumpadBlockDto } from './dtos/numpad/canvas-numpad-block.dto';
import { CanvasStageDto } from './dtos/stage/canvas-stage.dto';
import { SessionGuard } from 'src/common/session.guard';
import { CreateCanvasStageDto } from './dtos/stage/create-canvas-stage.dto';
import { UpdateCanvasStageDto } from './dtos/stage/update-canvas-stage.dto';
import { CreateCanvasNumpadBlockDto } from './dtos/numpad/create-canvas-numpad-block.dto';
import { UpdateCanvasNumpadBlockDto } from './dtos/numpad/update-canvas-numpad-block.dto';

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
      return resp
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
    type: Boolean,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteStage(
    @Param('stageId', ParseUUIDPipe) stageId: string,
    @Req() req: Request,
  ): Promise<boolean> {
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
    type: Boolean,
  })
  @ApiResponse({
    status: 401, // 添加 401 響應到 Swagger 文檔
    description: 'Unauthorized',
  })
  @UseGuards(SessionGuard)
  async deleteBlock(
    @Param('blockId', ParseUUIDPipe) blockId: string,
    @Req() req: Request,
  ): Promise<boolean> {
    if (req.user) {
      return this.canvasService.removeNumpadBlock(blockId, req.user);
    } else {
      throw new UnauthorizedException('User not logged in or session expired.');
    }
  }
}
