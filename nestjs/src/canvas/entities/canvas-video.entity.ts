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

export enum CANVAS_VIDEO_TYPE {
  YOUTUBE = 'YOUTUBE',
}

@Entity({ name: 'canvas_video' })
export class CanvasVideo {
  @PrimaryColumn()
  id!: string; // generate by uuid from client

  @Column()
  type: CANVAS_VIDEO_TYPE;

  @Column()
  src: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  title: string | null;

  @Column({ type: 'float' })
  x: number; // unit:viewportWidthUnit

  @Column({ type: 'float' })
  y: number; // unit:viewportHeightUnit

  @Column({ type: 'float' })
  rotation: number; // unit:degree

  @Column({ type: 'float' })
  scaleX: number;

  @Column({ type: 'float' })
  scaleY: number;

  @ManyToOne(() => User, (user) => user.canvas_video, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

  @ManyToOne(() => CanvasStage, (stage) => stage.video, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  stage: CanvasStage;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
