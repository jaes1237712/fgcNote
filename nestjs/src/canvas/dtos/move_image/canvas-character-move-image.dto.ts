import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CharacterMoveImageDto } from 'src/character/dtos/character-move-image.dto';
import { NODE_KIND } from 'src/common/interface';


export class CanvasCharacterMoveImageDto {
  @ApiProperty({ 
    description: 'For frontend to distinguish node kind',
    enum: [NODE_KIND.CHARACTER_MOVE_IMAGE]
  })
  @Expose()
  kind: NODE_KIND.CHARACTER_MOVE_IMAGE;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  @Expose()
  x: number; // unit:viewportWidthUnit

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  @Expose()
  y: number; // unit:viewportHeightUnit

  @ApiProperty()
  @Expose()
  rotation: number; // unit:degree

  @ApiProperty()
  @Expose()
  scaleX: number;
  
  @ApiProperty()
  @Expose()
  scaleY: number;

  @ApiProperty()
  @Expose()
  @Type(() => CharacterMoveImageDto)
  characterMoveImage: CharacterMoveImageDto;
}
