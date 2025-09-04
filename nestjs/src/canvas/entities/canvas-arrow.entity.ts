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
import { ValueTransformer } from 'typeorm';

class JsonTransformer implements ValueTransformer {
  to(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }
    // Stringify the object to be stored as TEXT in the database
    return JSON.stringify(value);
  }

  from(value: string | null): any {
    if (value === null || value === undefined) {
      return null;
    }
    // Parse the JSON string back into a JavaScript object
    try {
      return JSON.parse(value);
    } catch (e) {
      // Handle cases where the stored value might not be valid JSON
      console.error('Error parsing JSON from database:', value, e);
      return null; // Or throw an error, depending on desired behavior
    }
  }
}

@Entity({ name: 'canvas_arrow' })
export class CanvasArrow {
  @PrimaryColumn()
  id!: string;

  @Column()
  startNodeId: string; // other canvas entity primary ID

  @Column()
  endNodeId: string; // other canvas entity primary ID

  @Column({
    type: 'text',
    transformer: new JsonTransformer(),
  })
  points: number[]; // unit:viewportWidthUnit

  @ManyToOne(() => User, (user) => user.canvas_arrows, {
    cascade: true,
    onDelete: 'CASCADE',
    eager: true,
  })
  user: User;

  @ManyToOne(() => CanvasStage, (stage) => stage.arrows, {
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
