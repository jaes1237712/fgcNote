import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
} from 'typeorm';
import { Character } from './character.entity';
import { CanvasCharacterMoveImage } from 'src/canvas/entities/canvas-character-move-image.entity';

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

  @OneToMany(
    () => CanvasCharacterMoveImage,
    (canvasImage) => canvasImage.characterMoveImage,
  )
  canvasCharacterMoveImage: CanvasCharacterMoveImage[];

  @Column()
  characterId!: number;

  @CreateDateColumn()
  createdAt!: Date;
}
