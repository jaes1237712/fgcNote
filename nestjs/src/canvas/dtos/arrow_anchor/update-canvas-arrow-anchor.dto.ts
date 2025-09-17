import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID } from 'class-validator';

export class UpdateCanvasArrowAnchorDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @IsNumber()
  x: number;

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @IsNumber()
  y: number;
}
