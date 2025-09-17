import { IsString, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCanvasArrowAnchorDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: 'Stage ID' })
  @IsUUID()
  stageId: string;

  @ApiProperty({ description: 'Arrow ID' })
  @IsUUID()
  arrowId: string;
}
