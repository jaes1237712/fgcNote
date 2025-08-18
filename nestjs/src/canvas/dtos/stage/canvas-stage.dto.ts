import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { CharacterDto } from 'src/character/dtos/character.dto';
import { UserDto } from 'src/user/dtos/user.dto';

export class CanvasStageDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  characterMe: CharacterDto;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  characterOpponent: CharacterDto;

  @ApiProperty({ description: 'Stage Name' })
  @Expose()
  name!: string;

  @ApiProperty({ description: 'who create this stage' })
  @Expose()
  user: UserDto;
}
