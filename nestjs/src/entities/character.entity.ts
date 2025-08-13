import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CharacterMoveImage } from './character-move-image.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'character' })
export class Character {
  // @ApiProperty({ description: '角色唯一識別碼' })
  @PrimaryGeneratedColumn()
  id!: number;

  // @ApiProperty({ description: '角色名稱（唯一）' })
  @Column({ unique: true })
  name!: string;

  // @ApiProperty({ description: '角色Icon圖片' })
  @Column({ unique: true })
  iconFilePath!: string;

  // @ApiProperty({ description: '角色Portrait圖片' })
  @Column({ unique: true })
  portraitFilePath!: string;

  @OneToMany(() => CharacterMoveImage, (image) => image.character, {
    cascade: true,
  })
  moveImages!: CharacterMoveImage[];

  // @ApiProperty({ description: '檔案系統中的資料夾路徑' })
  @Column()
  folderPath!: string;

  // @ApiProperty({ description: '創建時間' })
  @CreateDateColumn()
  createdAt!: Date;

  // @ApiProperty({ description: '更新時間' })
  @UpdateDateColumn()
  updatedAt!: Date;
}

export class CharacterDto {
  @ApiProperty({ description: '角色名稱' })
  name!: string;

  @ApiProperty({ description: '角色Icon圖片' })
  iconFilePath!: string;

  @ApiProperty({ description: '角色Portrait圖片' })
  portraitFilePath!: string;
}
