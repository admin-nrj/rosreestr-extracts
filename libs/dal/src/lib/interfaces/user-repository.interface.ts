import { UserEntity } from '@rosreestr-extracts/entities';

/**
 * User repository interface
 * Defines contract for user data access operations
 */
export interface IUserRepository {
  /**
   * Find user by ID
   */
  findById(id: number): Promise<UserEntity | null>;

  /**
   * Find user by email
   */
  findByEmail(email: string): Promise<UserEntity | null>;

  /**
   * Create a new user
   */
  create(userData: Partial<UserEntity>): Promise<UserEntity>;

  /**
   * Update user
   */
  update(id: number, userData: Partial<UserEntity>): Promise<UserEntity>;

  /**
   * Update user's last login timestamp
   */
  updateLastLogin(id: number): Promise<void>;

  /**
   * Soft delete user (sets deleted_at)
   */
  softDelete(id: number): Promise<void>;

  /**
   * Restore soft-deleted user
   */
  restore(id: number): Promise<void>;

  /**
   * Check if email exists
   */
  emailExists(email: string): Promise<boolean>;

  /**
   * Find all active users
   */
  findAllActive(): Promise<UserEntity[]>;
}
