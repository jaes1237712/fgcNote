import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CharacterDto {
  @ApiProperty({ description: 'Primary ID' })
  @Expose()
  id!: number;

  @ApiProperty({ description: 'Character Name' })
  @Expose()
  name!: string;

  @ApiProperty({ description: 'Icon Path' })
  @Expose()
  iconFilePath!: string;

  @ApiProperty({ description: 'Portrait Path' })
  @Expose()
  portraitFilePath!: string;
}
