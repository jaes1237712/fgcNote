import { Type } from 'class-transformer';
import { IsArray, IsUUID, ValidateNested } from 'class-validator';
import { CreateCanvasCharacterMoveImageDto } from './create-canvas-character-move-image.dto';
import { ApiProperty } from '@nestjs/swagger';


export class SyncCanvasCharacterMoveImagesDto {
  @ApiProperty()
  @IsUUID()
  stageId: string;

  @ApiProperty({
    type: () => [CreateCanvasCharacterMoveImageDto]
  })
  @IsArray()
  @ValidateNested({ each: true }) // 確保陣列中的每個物件都符合 CreateCanvasNumpadBlockDto 的驗證規則
  @Type(() => CreateCanvasCharacterMoveImageDto)
  characterMoveImages: CreateCanvasCharacterMoveImageDto[];
}