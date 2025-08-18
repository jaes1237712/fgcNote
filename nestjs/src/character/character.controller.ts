import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CharacterService } from './character.service';
import { CharacterDto } from './dtos/character.dto';
import { CharacterMoveImageDto } from './dtos/character-move-image.dto';

@ApiTags('characters')
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  @ApiOperation({
    description: 'Return all characters',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully get all characters',
    type: CharacterDto,
    isArray: true,
  })
  async findAll(): Promise<CharacterDto[]> {
    return this.characterService.findAll();
  }

  @Get(':id/images')
  @ApiOperation({
    description: 'Get all the images of certain character',
  })
  @ApiParam({ name: 'id', description: '角色 ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: 'Successfully get images of character',
    type: CharacterMoveImageDto,
    isArray: true,
  })
  async findImages(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CharacterMoveImageDto[]> {
    return this.characterService.findMoveImages(id);
  }
}
