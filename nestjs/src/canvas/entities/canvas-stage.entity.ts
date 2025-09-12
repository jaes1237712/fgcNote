import {
  Column,
  CreateDateColumn,
  Entity,
  UpdateDateColumn,
  PrimaryColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { User } from 'src/user/entities/user.entity';
import { Character } from 'src/character/entities/character.entity';
import { CanvasNumpadBlock } from './canvas-numpad-block.entity';
import { CanvasArrow } from './canvas-arrow.entity';
import { CanvasText } from './canvas-text.entity';

@Entity({ name: 'canvas_stage' })
export class CanvasStage {
  @PrimaryColumn()
  id!: string; // Generate from client

  @ManyToOne(() => Character, (character) => character.stagesMe, {
    eager: true,
  })
  characterMe: Character;

  @ManyToOne(() => Character, (character) => character.stagesOpponent, {
    eager: true,
  })
  characterOpponent: Character;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.canvas_stages, {
    cascade: true,
    eager: true,
  })
  user!: User;

  @OneToMany(() => CanvasNumpadBlock, (block) => block.stage)
  numpadBlocks?: CanvasNumpadBlock[];

  @OneToMany(() => CanvasArrow, (arrow) => arrow.stage)
  arrows?: CanvasArrow[];

  @OneToMany(() => CanvasText, (text) => text.stage)
  text?: CanvasText[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
