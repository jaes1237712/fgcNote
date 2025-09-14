import { IsUUID, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateCanvasVideoDto } from './create-canvas-video.dto';

export class SyncCanvasVideoDto {
  @ApiProperty({ description: 'Stage ID' })
  @IsUUID()
  stageId: string;

  @ApiProperty({
    description: 'Array of video objects to sync',
    type: () => [CreateCanvasVideoDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCanvasVideoDto)
  videos: any[];
}
