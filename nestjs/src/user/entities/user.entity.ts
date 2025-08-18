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

  @OneToMany(() => CanvasStage, (stage) => stage.user)
  canvas_stages: CanvasStage[];
}
