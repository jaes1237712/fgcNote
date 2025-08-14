import { ApiProperty } from '@nestjs/swagger';

export class CharacterDto {
    @ApiProperty({ description: 'Character Name' })
    name!: string;
  
    @ApiProperty({ description: 'Icon Path' })
    iconFilePath!: string;
  
    @ApiProperty({ description: 'Portrait Path' })
    portraitFilePath!: string;
}