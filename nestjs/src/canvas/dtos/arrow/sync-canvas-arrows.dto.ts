import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { CreateCanvasArrowDto } from './create-arrow.dto';
import { ApiProperty } from '@nestjs/swagger';

export class SyncCanvasArrowsDto {
  @ApiProperty()
  @IsUUID()
  stageId: string;

  @ApiProperty({
    type: () => [CreateCanvasArrowDto],
  })
  @IsArray()
  @ValidateNested({ each: true }) // 確保陣列中的每個物件都符合 CreateCanvasNumpadBlockDto 的驗證規則
  @Type(() => CreateCanvasArrowDto)
  arrows: CreateCanvasArrowDto[];
}
