import { ApiProperty } from '@nestjs/swagger';

export class CharacterMoveImageDto {
    @ApiProperty({ description: 'File name of the image' })
    fileName!: string;
  
    @ApiProperty({ description: 'File path of the image' })
    filePath!: string;
  
    @ApiProperty({ description: 'ID of the associated character' })
    characterId!: number;
}