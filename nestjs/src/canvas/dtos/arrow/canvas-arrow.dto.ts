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

  @ApiProperty({
    description: 'other canvas entity primary ID',
    type: String, // <-- 明確指定為 String
    nullable: true, // <-- 明確指定為可為 null
  })  
  @Expose()
  endNodeId: string | null;

  @ApiProperty({
    description: 'Konva arrow attrs points',
    type: Number, 
    isArray: true,
  })
  @IsArray()
  @Expose()
  points: number[]; // unit:viewportHeightUnit
}
