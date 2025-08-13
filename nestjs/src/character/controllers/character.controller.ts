import { Controller, Get, Param, ParseIntPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { CharacterService } from '../services/character.service';
import { CharacterDto } from '../../entities/character.entity';
import { CharacterImageDto } from '../../entities/character-move-image.entity';

@ApiTags('characters')
@Controller('characters')
export class CharacterController {
  constructor(private readonly characterService: CharacterService) {}

  @Get()
  @ApiOperation({
    summary: '獲取所有角色',
    description: '返回所有活躍的角色列表',
  })
  @ApiResponse({
    status: 200,
    description: '成功獲取角色列表',
    type: [CharacterDto],
  })
  async findAll(): Promise<CharacterDto[]> {
    return this.characterService.findAll();
  }

  @Get(':id/images')
  @ApiOperation({
    summary: '獲取角色圖片',
    description: '獲取特定角色的所有圖片',
  })
  @ApiParam({ name: 'id', description: '角色 ID', type: 'number' })
  @ApiResponse({
    status: 200,
    description: '成功獲取角色圖片',
    type: [CharacterImageDto],
  })
  async findImages(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CharacterImageDto[]> {
    return this.characterService.findMoveImages(id);
  }
}
