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
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  fileName!: string;

  @Column()
  filePath!: string;

  @Column()
  fileSize!: number;

  @Column({ nullable: true })
  mimeType?: string;

  @Column({ nullable: true })
  width?: number;

  @Column({ nullable: true })
  height?: number;

  @ManyToOne(() => Character, (character) => character.moveImages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'characterId' })
  character!: Character;

  @Column()
  characterId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
