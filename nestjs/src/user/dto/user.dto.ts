export class UserDto {
  id: string;
  email!: string;
  nickname!: string;
  picture!: string | null;
  google_sub!: string;
  created_at!: Date;
  updated_at!: Date;
}
