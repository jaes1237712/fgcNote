import { ApiProperty } from '@nestjs/swagger';
import { CharacterMoveImageDto } from 'src/character/dtos/character-move-image.dto';

export class CreateCanvasCharacterMoveImageDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  id!: string;

  @ApiProperty({ description: 'x, unit: viewportWidthUnit' })
  x: number; // unit:viewportWidthUnit

  @ApiProperty({ description: 'y, unit: viewportHeightUnit' })
  y: number; // unit:viewportHeightUnit

  @ApiProperty()
  characterMoveImage: CharacterMoveImageDto;

  @ApiProperty({ description: 'belong to which stage' })
  stageId: string;
}
