import {IsUUID, IsArray, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { CreateCanvasTextDto } from './create-canvas-text.dto';

export class SyncCanvasTextDto {
  @ApiProperty({ description: 'Stage ID' })
  @IsUUID()
  stageId: string;

  @ApiProperty({ 
    description: 'Array of text objects to sync',
    type: () => [CreateCanvasTextDto]
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateCanvasTextDto)
  texts: any[];
}
