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

@Entity({ name: 'canvas_text' })
export class CanvasText {
  @PrimaryColumn()
  id!: string; // generate by uuid from client

  @Column()
  text: string;

  @Column()
  fontColor: string;

  @Column()
  backgroundColor: string;

  @Column({ type: 'float' })
  x: number; // unit:viewportWidthUnit

  @Column({ type: 'float' })
  y: number; // unit:viewportHeightUnit

  @Column({ type: 'float' })
  rotation: number; // unit:degree

  @Column({ type: 'float' })
  fontSize: number;

  @Column({type:'boolean'})
  isBold: boolean

  @Column({type:'boolean'})
  isItalic: boolean

  @Column({type:'boolean'})
  isUnderline: boolean

  @ManyToOne(() => User, (user) => user.canvas_texts, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

  @ManyToOne(() => CanvasStage, (stage) => stage.texts, {
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
