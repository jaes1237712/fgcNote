import { ApiProperty } from '@nestjs/swagger';
import { CONTROLLER_TYPE } from '../../../common/interface';

export class UpdateCanvasNumpadBlockDto {
    @ApiProperty({ description: 'UUIDv4, generate by client' })
    id!: string;
  
    @ApiProperty({ description: 'Numpad Input, like 623p' })
    input!: string;
  
    @ApiProperty({ 
      description: 'CONTROLLER_TYPE, modern or classic',
      enum: CONTROLLER_TYPE,
      example: CONTROLLER_TYPE.MODERN, 
    })
    type!: CONTROLLER_TYPE; 
  
    @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
    x: number; // unit:viewportWidthUnit
  
    @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
    y: number; // unit:viewportHeightUnit
  }