import { IsString, IsNumber, IsOptional, IsUUID, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { NODE_KIND } from 'src/common/interface';
import { Expose } from 'class-transformer';

export class CanvasTextDto {
  @ApiProperty({
    description: 'For frontend to distinguish node kind',
    enum: [NODE_KIND.TEXT],
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

  @ApiProperty({ description: 'Font color(hex)' })
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

  @ApiProperty({ description: 'fontSize' })
  @IsNumber()
  @Expose()
  fontSize: number;

  @ApiProperty()
  @IsBoolean()
  @Expose()
  isBold: boolean

  @ApiProperty()
  @IsBoolean()
  @Expose()  
  isItalic: boolean

  @ApiProperty()
  @IsBoolean()
  @Expose()  
  isUnderline: boolean

  @ApiProperty({ description: 'Stage ID', required: false })
  @IsUUID()
  @IsOptional()
  @Expose()
  stageId?: string;
}
