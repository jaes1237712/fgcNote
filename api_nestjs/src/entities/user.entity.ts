import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

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

  @Column({ type: 'text', nullable: true })
  nickname!: string | null;

  @CreateDateColumn({ type: 'datetime' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updated_at!: Date;
}

export class UserPublicDto {
  email!: string;
  name!: string;
  picture!: string | null;
  google_sub!: string;
  created_at!: Date;
  updated_at!: Date;
}


