import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsUUID } from 'class-validator';

export class UpdateCanvasTextDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @IsUUID()
  id!: string;

  @ApiProperty({ description: 'Text content' })
  @IsString()
  text: string;

  @ApiProperty({ description: 'Font color' })
  @IsString()
  fontColor: string;

  @ApiProperty({ description: 'Background color' })
  @IsString()
  backgroundColor: string;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @IsNumber()
  x: number; // unit:viewportWidthUnit

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @IsNumber()
  y: number; // unit:viewportHeightUnit

  @ApiProperty({ description: 'rotation, unit: degree' })
  @IsNumber()
  rotation: number; // unit:degree

  @ApiProperty({ description: 'fontSize' })
  @IsNumber()
  fontSize: number;
}
