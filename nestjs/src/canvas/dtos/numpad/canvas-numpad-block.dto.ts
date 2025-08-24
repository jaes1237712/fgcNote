import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CONTROLLER_TYPE } from '../../../common/interface';

export class CanvasNumpadBlockDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Numpad Input, like 623p' })
  @Expose()
  input!: string;

  @ApiProperty({
    description: 'CONTROLLER_TYPE, modern or classic',
    enum: CONTROLLER_TYPE,
    example: CONTROLLER_TYPE.MODERN,
  })
  @Expose()
  type!: CONTROLLER_TYPE;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @Expose()
  x: number; // unit:viewportWidthUnit

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @Expose()
  y: number; // unit:viewportHeightUnit
}
