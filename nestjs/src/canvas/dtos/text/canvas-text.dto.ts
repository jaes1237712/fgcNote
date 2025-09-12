import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NODE_KIND } from 'src/common/interface';
import { Expose } from 'class-transformer';

export class CanvasTextDto {
  @ApiProperty({ 
    description: 'For frontend to distinguish node kind',
    enum: [NODE_KIND.TEXT]
  })
  @Expose()
  kind: NODE_KIND.TEXT;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty({ description: 'Text content' })
  @IsString()
  @Expose()
  text: string;

  @ApiProperty({ description: 'Font color' })
  @IsString()
  @Expose()
  fontColor: string;

  @ApiProperty({ description: 'Background color' })
  @IsString()
  @Expose()
  backgroundColor: string;

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
