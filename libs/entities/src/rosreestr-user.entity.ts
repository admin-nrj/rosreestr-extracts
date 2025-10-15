import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

/**
 * RosreestrUser entity representing credentials for Rosreestr API access
 * Each worker uses one RosreestrUser's credentials to process orders
 */
@Entity('rosreestr_users')
export class RosreestrUserEntity extends BaseEntity {
  @Column({ unique: true, length: 255 })
  username: string;

  @Column({ name: 'password_encrypted', type: 'text' })
  passwordEncrypted: string;

  @Column({ name: 'gu_login', length: 255, nullable: false })
  guLogin: string;

  @Column({ length: 500, nullable: true })
  comment?: string;
}
