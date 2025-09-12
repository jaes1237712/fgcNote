import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CanvasNumpadBlock } from 'src/canvas/entities/canvas-numpad-block.entity';
import { CanvasStage } from 'src/canvas/entities/canvas-stage.entity';
import { CanvasCharacterMoveImage } from 'src/canvas/entities/canvas-character-move-image.entity';
import { CanvasArrow } from 'src/canvas/entities/canvas-arrow.entity';
import { CanvasText } from 'src/canvas/entities/canvas-text.entity';

@Entity({ name: 'user' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  picture!: string | null;

  @Column({ unique: true })
  google_sub!: string;

  @Column({ type: 'text' })
  nickname!: string;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;

  @OneToMany(() => CanvasNumpadBlock, (block) => block.user)
  canvas_numpad_blocks: CanvasNumpadBlock[];

  @OneToMany(() => CanvasArrow, (arrow) => arrow.user)
  canvas_arrows: CanvasArrow[];

  @OneToMany(() => CanvasStage, (stage) => stage.user)
  canvas_stages: CanvasStage[];

  @OneToMany(() => CanvasCharacterMoveImage, (image) => image.user)
  canvas_character_move_images: CanvasCharacterMoveImage[];

  @OneToMany(() => CanvasText, (text) => text.user)
  canvas_text: CanvasText[];
}
