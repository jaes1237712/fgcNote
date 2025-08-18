import { ApiProperty } from '@nestjs/swagger';
export class CreateUserDto {
  @ApiProperty()
  email: string;
  @ApiProperty()
  picture?: string | null;
  @ApiProperty()
  google_sub: string;
  @ApiProperty()
  name: string;
  @ApiProperty({
    description: 'User Nickname(Default Google Name)',
    type: String,
    nullable: true,
  })
  nickname: string;
}
