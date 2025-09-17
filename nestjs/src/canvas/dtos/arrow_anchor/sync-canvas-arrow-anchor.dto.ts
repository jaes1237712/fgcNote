import { IsUUID, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateCanvasArrowAnchorDto } from './create-canvas-arrow-anchor.dto';

export class SyncCanvasArrowAnchorDto {
  @ApiProperty({ description: 'Stage ID' })
  @IsUUID()
  stageId: string;

  @ApiProperty({
    description: 'Array of arrow anchor objects to sync',
    type: () => [CreateCanvasArrowAnchorDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCanvasArrowAnchorDto)
  arrowAnchors: any[];
}
