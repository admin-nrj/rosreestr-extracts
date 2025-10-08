import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';
import { UserRole } from './enums/user-role.enum';

/**
 * User entity representing application users
 */
@Entity('users')
export class UserEntity extends BaseEntity {
  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ name: 'password_hash', length: 255 })
  passwordHash: string;

  @Column({ length: 255, nullable: true })
  name?: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER,
  })
  role: UserRole;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'email_verified', default: false })
  emailVerified: boolean;

  @Column({ name: 'last_login_at', type: 'timestamp', nullable: true })
  lastLoginAt?: Date;
}
