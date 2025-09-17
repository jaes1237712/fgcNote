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
import { CanvasArrow } from './canvas-arrow.entity';
  
  @Entity({ name: 'canvas_arrow_anchor' })
  export class CanvasArrowAnchor {
    @PrimaryColumn()
    id!: string; // generate by uuid from client
  
    @Column({ type: 'float' })
    x: number; // unit:viewportWidthUnit
  
    @Column({ type: 'float' })
    y: number; // unit:viewportHeightUnit
  
    @ManyToOne(() => User, (user) => user.canvas_arrow_anchors, {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
    })
    user: User;
  
    @ManyToOne(() => CanvasStage, (stage) => stage.arrowAnchors, {
      cascade: true,
      onDelete: 'CASCADE',
      eager: true,
    })
    stage: CanvasStage;

    @ManyToOne(()=> CanvasArrow, (arrow) => arrow.anchor, {
        cascade: true,
        onDelete: 'CASCADE',
        eager: true,
    })
    arrow: CanvasArrow

    @CreateDateColumn()
    createdAt!: Date;
  
    @UpdateDateColumn()
    updatedAt!: Date;
  }
  