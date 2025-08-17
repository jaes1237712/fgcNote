import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { CharacterMoveImage } from './character-move-image.entity';

@Entity({ name: 'character' })
export class Character {
  // @ApiProperty({ description: 'Primary ID' })
  @PrimaryGeneratedColumn()
  id!: number;

  // @ApiProperty({ description: 'Character Name' })
  @Column({ unique: true })
  name!: string;

  // @ApiProperty({ description: 'Icon Path' })
  @Column({ unique: true })
  iconFilePath!: string;

  // @ApiProperty({ description: 'Portrait Path' })
  @Column({ unique: true })
  portraitFilePath!: string;

  @OneToMany(() => CharacterMoveImage, (image) => image.character, {
    cascade: true,
  })
  moveImages!: CharacterMoveImage[];

  // @ApiProperty({ description: 'Character Folder' })
  @Column()
  folderPath!: string;

  // @ApiProperty({ description: 'Created at' })
  @CreateDateColumn()
  createdAt!: Date;

  // @ApiProperty({ description: 'Updated at' })
  @UpdateDateColumn()
  updatedAt!: Date;
}
