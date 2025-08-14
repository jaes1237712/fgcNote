import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Character } from './character.entity';

@Entity({ name: 'character_move_image' })
export class CharacterMoveImage {
  // @ApiProperty({ description: 'Unique identifier for the image' })
  @PrimaryGeneratedColumn()
  id!: number;

  // @ApiProperty({ description: 'File name of the image' })
  @Column()
  fileName!: string;

  // @ApiProperty({ description: 'File path of the image' })
  @Column()
  filePath!: string;

  // @ApiProperty({ description: 'File size of the image in bytes' })
  @Column()
  fileSize!: number;

  // @ApiProperty({ description: 'MIME type of the image file', required: false })
  @Column({ nullable: true })
  mimeType?: string;

  // @ApiProperty({ description: 'Width of the image in pixels', required: false })
  @Column({ nullable: true })
  width?: number;

  // @ApiProperty({ description: 'Height of the image in pixels', required: false })
  @Column({ nullable: true })
  height?: number;

  @ManyToOne(() => Character, (character) => character.moveImages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'characterId' })
  character!: Character;

  // @ApiProperty({ description: 'ID of the associated character' })
  @Column()
  characterId!: number;

  // @ApiProperty({ description: 'Creation timestamp' })
  @CreateDateColumn()
  createdAt!: Date;
}