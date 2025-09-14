import { ApiProperty } from '@nestjs/swagger';
import {
  IsString,
  IsNumber,
  IsUUID,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { CANVAS_VIDEO_TYPE } from '../../entities/canvas-video.entity';

export class UpdateCanvasVideoDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Video type', enum: CANVAS_VIDEO_TYPE })
  @IsEnum(CANVAS_VIDEO_TYPE)
  type: CANVAS_VIDEO_TYPE;

  @ApiProperty({ description: 'Video source URL' })
  @IsString()
  src: string;

  @ApiProperty({
    description: 'Show up title on canvas',
    type: String, // <-- 明確指定為 String
    nullable: true, // <-- 明確指定為可為 null
  })
  @IsString()
  @IsOptional()
  title?: string | null;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @IsNumber()
  x: number; // unit:viewportWidthUnit

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @IsNumber()
  y: number; // unit:viewportHeightUnit

  @ApiProperty({ description: 'rotation, unit: degree' })
  @IsNumber()
  rotation: number; // unit:degree

  @ApiProperty({ description: 'scaleX' })
  @IsNumber()
  scaleX: number;

  @ApiProperty({ description: 'scaleY' })
  @IsNumber()
  scaleY: number;
}
