import {
  IsString,
  IsNumber,
  IsOptional,
  IsUUID,
  IsEnum,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NODE_KIND } from 'src/common/interface';
import { Expose } from 'class-transformer';
import { CANVAS_VIDEO_TYPE } from '../../entities/canvas-video.entity';

export class CanvasVideoDto {
  @ApiProperty({
    description: 'For frontend to distinguish node kind',
    enum: [NODE_KIND.VIDEO],
  })
  @Expose()
  kind: NODE_KIND.VIDEO;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Video type', enum: CANVAS_VIDEO_TYPE })
  @IsEnum(CANVAS_VIDEO_TYPE)
  @Expose()
  type: CANVAS_VIDEO_TYPE;

  @ApiProperty({ description: 'Video source URL' })
  @IsString()
  @Expose()
  src: string;

  @ApiProperty({
    description: 'Show up title on canvas',
    type: String, // <-- 明確指定為 String
    nullable: true, // <-- 明確指定為可為 null
  })
  @IsString()
  @IsOptional()
  @Expose()
  title?: string | null;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @IsNumber()
  @Expose()
  x: number;

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @IsNumber()
  @Expose()
  y: number;

  @ApiProperty({ description: 'rotation, unit: degree' })
  @IsNumber()
  @Expose()
  rotation: number;

  @ApiProperty({ description: 'scaleX' })
  @IsNumber()
  @Expose()
  scaleX: number;

  @ApiProperty({ description: 'scaleY' })
  @IsNumber()
  @Expose()
  scaleY: number;

  @ApiProperty({ description: 'Stage ID', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  stageId?: string;
}
