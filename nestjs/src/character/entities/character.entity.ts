import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CharacterMoveImage } from './character-move-image.entity';
import { CanvasStage } from 'src/canvas/entities/canvas-stage.entity';

@Entity({ name: 'character' })
export class Character {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  name!: string;

  @Column({ unique: true })
  iconFilePath!: string;

  @Column({ unique: true })
  portraitFilePath!: string;

  @OneToMany(() => CharacterMoveImage, (image) => image.character, {
    cascade: true,
  })
  moveImages!: CharacterMoveImage[];

  @OneToMany(() => CanvasStage, (stage) => stage.characterMe)
  stagesMe: CanvasStage[];

  @OneToMany(() => CanvasStage, (stage) => stage.characterOpponent)
  stagesOpponent: CanvasStage[];

  @Column()
  folderPath!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
