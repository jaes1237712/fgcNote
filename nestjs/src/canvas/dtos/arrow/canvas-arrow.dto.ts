import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';

export class CanvasArrowDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  id!: string;

  @ApiProperty({ description: ' other canvas entity primary ID' })
  @Expose()
  startNodeId: string;

  @ApiProperty({ description: 'other canvas entity primary ID' })
  @Expose()
  endNodeId: string;

  @ApiProperty({
    description: 'Konva arrow attrs points',
    type: [Number],
    isArray: true,
  })
  @Expose()
  @IsArray()
  points: number[]; // unit:viewportHeightUnit
}
