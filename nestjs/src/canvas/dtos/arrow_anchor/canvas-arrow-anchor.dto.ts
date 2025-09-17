import { IsString, IsNumber, IsOptional, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NODE_KIND } from 'src/common/interface';
import { Expose } from 'class-transformer';

export class CanvasArrowAnchorDto {
  @ApiProperty({
    description: 'For frontend to distinguish node kind',
    enum: [NODE_KIND.ARROW_ANCHOR],
  })
  @Expose()
  kind: NODE_KIND.ARROW_ANCHOR;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @IsUUID()
  @Expose()
  id: string;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @IsNumber()
  @Expose()
  x: number;

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @IsNumber()
  @Expose()
  y: number;

  @ApiProperty({ description: 'Stage ID', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  stageId?: string;

  @ApiProperty({ description: 'Arrow ID'})
  @IsUUID()
  @Expose()
  arrowId: string;
}
