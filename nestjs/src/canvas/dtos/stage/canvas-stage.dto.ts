import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CharacterDto } from 'src/character/dtos/character.dto';
import { UserDto } from 'src/user/dtos/user.dto';

export class CanvasStageDto {
  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  id!: string;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  @Type(() => CharacterDto)
  characterMe: CharacterDto;

  @ApiProperty({ description: 'UUIDv4, generate by client' })
  @Expose()
  @Type(() => CharacterDto)
  characterOpponent: CharacterDto;

  @ApiProperty({ description: 'Stage Name' })
  @Expose()
  name!: string;

  @ApiProperty({ description: 'who create this stage' })
  @Expose()
  @Type(() => UserDto)
  user: UserDto;
}
