import { Controller, Post } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CharacterService } from '../services/character.service';
import { CharacterSyncService } from '../services/character-sync.service';

@ApiTags('admin')
@Controller('admin/characters')
export class CharacterAdminController {
  constructor(private readonly characterSyncService: CharacterSyncService) {}

  @Post('sync')
  @ApiOperation({
    summary: '同步檔案系統',
    description: '將檔案系統中的角色資料同步到資料庫',
  })
  @ApiResponse({
    status: 201,
    description: '同步完成',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        stats: {
          type: 'object',
          properties: {
            totalCharacters: { type: 'number' },
            totalImages: { type: 'number' },
            updatedCharacters: { type: 'number' },
            updatedImages: { type: 'number' },
            syncTime: { type: 'string' },
          },
        },
      },
    },
  })
  async syncFromFileSystem() {
    const result = await this.characterSyncService.syncFromFileSystem();
    return result;
  }
}
