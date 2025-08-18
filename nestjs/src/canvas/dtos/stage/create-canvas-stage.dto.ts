import { ApiProperty } from '@nestjs/swagger';
import { CharacterDto } from 'src/character/dtos/character.dto';
export class CreateCanvasStageDto {
  @ApiProperty()
  id!: string; // Generate from client

  @ApiProperty()
  characterMe: CharacterDto;

  @ApiProperty()
  characterOpponent: CharacterDto;

  @ApiProperty()
  name: string;
}
