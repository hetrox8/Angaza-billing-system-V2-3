import { Entity, PrimaryGeneratedColumn, Column, Index } from 'typeorm';

/**
 * FreeRADIUS SQL Tables for PostgreSQL backend
 * These tables are used by FreeRADIUS when configured with PostgreSQL
 */

@Entity({ name: 'radcheck' })
@Index(['username'])
export class RadCheck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  attribute: string;

  @Column({ type: 'varchar', length: 2 })
  op: string; // :=, +=, =, etc.

  @Column({ type: 'text', nullable: true })
  value: string;
}

@Entity({ name: 'radreply' })
@Index(['username'])
export class RadReply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  attribute: string;

  @Column({ type: 'varchar', length: 2 })
  op: string; // :=, +=, =, etc.

  @Column({ type: 'text', nullable: true })
  value: string;
}

@Entity({ name: 'radusergroup' })
export class RadUserGroup {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  username: string;

  @Column()
  groupname: string;

  @Column({ type: 'integer', default: 0 })
  priority: number;
}

@Entity({ name: 'radgroupcheck' })
export class RadGroupCheck {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupname: string;

  @Column()
  attribute: string;

  @Column({ type: 'varchar', length: 2 })
  op: string;

  @Column({ type: 'text', nullable: true })
  value: string;
}

@Entity({ name: 'radgroupreply' })
export class RadGroupReply {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  groupname: string;

  @Column()
  attribute: string;

  @Column({ type: 'varchar', length: 2 })
  op: string;

  @Column({ type: 'text', nullable: true })
  value: string;
}
