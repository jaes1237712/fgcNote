import { IsString, IsNumber, IsUUID } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCanvasTextDto {
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
  x: number;

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @IsNumber()
  y: number;

  @ApiProperty({ description: 'rotation, unit: degree' })
  @IsNumber()
  rotation: number;

  @ApiProperty({ description: 'scaleX' })
  @IsNumber()
  scaleX: number;

  @ApiProperty({ description: 'scaleY' })
  @IsNumber()
  scaleY: number;

  @ApiProperty({ description: 'Stage ID' })
  @IsUUID()
  stageId: string;
}
