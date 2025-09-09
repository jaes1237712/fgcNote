import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsArray } from 'class-validator';

export class UpdateCanvasArrowDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  id!: string;

  @ApiProperty({ description: ' other canvas entity primary ID' })
  startNodeId: string;

  @ApiProperty({
    description: 'other canvas entity primary ID',
    type: String, // <-- 明確指定為 String
    nullable: true, // <-- 明確指定為可為 null
  })  
  endNodeId: string|null;

  @ApiProperty({
    description: 'Konva arrow attrs points',
    type: Number, 
    isArray: true,
  })
  @IsArray()
  points: number[]; // unit:viewportHeightUnit

  @ApiProperty({ description: 'belong to which stage' })
  stageId: string;
}
