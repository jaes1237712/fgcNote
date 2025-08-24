import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
} from 'typeorm';
import type { CONTROLLER_TYPE } from '../../common/interface';
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

  @Column({type:'float'})
  x: number; // unit:viewportWidthUnit

  @Column({type:'float'})
  y: number; // unit:viewportHeightUnit

  @ManyToOne(() => User, (user) => user.canvas_numpad_blocks, {
    cascade: true,
    onDelete: 'CASCADE',
    eager:true
  })
  user: User;

  @ManyToOne(() => CanvasStage, (stage) => stage.numpadBlocks, {
    cascade: true,
    onDelete: 'CASCADE',
    eager:true
  })
  stage: CanvasStage;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
