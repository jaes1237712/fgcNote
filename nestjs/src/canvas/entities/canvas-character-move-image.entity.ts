import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { CanvasStage } from './canvas-stage.entity';
import { CharacterMoveImage } from 'src/character/entities/character-move-image.entity';

@Entity({ name: 'canvas_character_move_image' })
export class CanvasCharacterMoveImage {
  @PrimaryColumn()
  id!: string; // generate by uuid from client

  @Column({ type: 'float' })
  x: number; // unit:viewportWidthUnit

  @Column({ type: 'float' })
  y: number; // unit:viewportHeightUnit

  @ManyToOne(() => User, (user) => user.canvas_character_move_images, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

  @ManyToOne(() => CanvasStage, (stage) => stage.numpadBlocks, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  stage: CanvasStage;

  @ManyToOne(
    () => CharacterMoveImage,
    (image) => image.canvasCharacterMoveImage,
    {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
    },
  )
  characterMoveImage: CharacterMoveImage;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
