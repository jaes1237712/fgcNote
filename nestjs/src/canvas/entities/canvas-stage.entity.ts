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

@Entity({ name: 'canvas_stage' })
export class CanvasStage {
  @PrimaryColumn()
  id!: string; // Generate from client

  @ManyToOne(() => Character, (character) => character.stagesMe)
  characterMe: Character;

  @ManyToOne(() => Character, (character) => character.stagesOpponent)
  characterOpponent: Character;

  @Column()
  name: string;

  @ManyToOne(() => User, (user) => user.canvas_stages, {
    cascade: true,
  })
  user!: User;

  @OneToMany(() => CanvasNumpadBlock, (block) => block.stage)
  numpadBlocks?: CanvasNumpadBlock[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
