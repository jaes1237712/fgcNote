import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { CreateCanvasNumpadBlockDto } from './create-canvas-numpad-block.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SyncCanvasNumpadBlocksDto {
  @ApiProperty()
  @IsUUID()
  stageId: string;

  @ApiProperty({
    type: () => [CreateCanvasNumpadBlockDto]
  })
  @IsArray()
  @ValidateNested({ each: true }) // 確保陣列中的每個物件都符合 CreateCanvasNumpadBlockDto 的驗證規則
  @Type(() => CreateCanvasNumpadBlockDto)
  blocks: CreateCanvasNumpadBlockDto[];
}