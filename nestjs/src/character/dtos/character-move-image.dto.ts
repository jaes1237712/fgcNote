import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CharacterMoveImageDto {
  @ApiProperty({ description: 'File name of the image' })
  @Expose()
  fileName!: string;

  @ApiProperty({ description: 'File path of the image' })
  @Expose()
  filePath!: string;

  @ApiProperty({ description: 'ID of the associated character' })
  @Expose()
  characterId!: number;

  @ApiProperty({ description: 'Width of the image in pixels'})
  @Expose()
  width?: number;

  @ApiProperty({ description: 'Height of the image in pixels'})
  @Expose()
  height?: number;
}
