import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
export class UserDto {
  @ApiProperty({ description: 'User ID' })
  @Expose()
  id!: string;
  @ApiProperty({ description: 'User Email' })
  @Expose()
  email!: string;
  @ApiProperty({ description: 'User Nickname(Default Google Name)' })
  @Expose()
  nickname!: string;
  @ApiProperty({ 
    description: 'User Google Picture',
    type: String, 
    nullable: true,
  })
  @Expose()
  picture!: string | null;
}