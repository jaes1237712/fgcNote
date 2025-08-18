import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class UpdateCanvasStageDto {
  @ApiProperty()
  id!: string;

  @ApiProperty({ description: 'The updated name of the stage' })
  @IsString()
  @IsNotEmpty() // 如果提供了，不能是空字符串
  name: string; // 使用問號表示它是可選的
}
