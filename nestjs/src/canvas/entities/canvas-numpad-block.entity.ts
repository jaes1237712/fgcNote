import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
} from 'typeorm';
import type { CONTROLLER_TYPE } from '/home/hung/fgcNote/common/interface.ts';
import { User } from 'src/user/entities/user.entity';
import { CanvasStage } from './canvas-stage.entity';

@Entity({ name: 'canvas_numpad_block' })
export class CanvasNumpadBlock {
  @PrimaryColumn()
  id!: string;

  @Column()
  input!: string;

  @Column()
  type!: CONTROLLER_TYPE;

  @Column()
  x: number; // unit:viewportWidthUnit

  @Column()
  y: number; // unit:viewportHeightUnit

  @ManyToOne(() => User, (user) => user.canvas_numpad_blocks, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => CanvasStage, (stage) => stage.numpadBlocks, {
    cascade: true,
    onDelete: 'CASCADE',
  })
  stage: CanvasStage;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
