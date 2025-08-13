import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';
import { ApiProperty } from '@nestjs/swagger';

@Entity({ name: 'character_move_image' })
export class CharacterMoveImage {
  @ApiProperty({ description: '圖片唯一識別碼' })
  @PrimaryGeneratedColumn()
  id!: number;

  @ApiProperty({ description: '圖片檔案名稱' })
  @Column()
  fileName!: string;

  @ApiProperty({ description: '圖片檔案路徑' })
  @Column()
  filePath!: string;

  @ApiProperty({ description: '圖片檔案大小（位元組）' })
  @Column()
  fileSize!: number;

  @ApiProperty({ description: '圖片 MIME 類型', required: false })
  @Column({ nullable: true })
  mimeType?: string;

  @ApiProperty({ description: '圖片寬度（像素）', required: false })
  @Column({ nullable: true })
  width?: number;

  @ApiProperty({ description: '圖片高度（像素）', required: false })
  @Column({ nullable: true })
  height?: number;

  @ManyToOne(() => Character, (character) => character.moveImages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'characterId' })
  character!: Character;

  @ApiProperty({ description: '所屬角色 ID' })
  @Column()
  characterId!: number;

  @ApiProperty({ description: '創建時間' })
  @CreateDateColumn()
  createdAt!: Date;
}

export class CharacterImageDto {
  @ApiProperty({ description: '圖片檔案名稱' })
  fileName!: string;

  @ApiProperty({ description: '圖片檔案路徑' })
  filePath!: string;

  @ApiProperty({ description: '所屬角色 ID' })
  characterId!: number;
}
