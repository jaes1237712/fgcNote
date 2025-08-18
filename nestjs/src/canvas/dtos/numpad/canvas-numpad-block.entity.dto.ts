import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import type { CONTROLLER_TYPE } from '/home/hung/fgcNote/common/interface.ts';
import { UserDto } from 'src/user/dtos/user.dto';

export class CanvasNumpadBlockDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'Numpad Input, like 623p' })
  @Expose()
  input!: string;

  @ApiProperty({ description: 'CONTROLLER_TYPE, modern or classic' })
  @Expose()
  type!: CONTROLLER_TYPE;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @Expose()
  x: number; // unit:viewportWidthUnit

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @Expose()
  y: number; // unit:viewportHeightUnit

  @ApiProperty({ description: 'who create this block' })
  @Expose()
  user: UserDto;
}
