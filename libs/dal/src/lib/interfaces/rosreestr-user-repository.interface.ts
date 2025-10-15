import { RosreestrUserEntity } from '@rosreestr-extracts/entities';

/**
 * Rosreestr User repository interface
 * Defines contract for Rosreestr user data access operations
 */
export interface IRosreestrUserRepository {
  /**
   * Find Rosreestr user by ID
   */
  findById(id: number): Promise<RosreestrUserEntity | null>;

  /**
   * Find Rosreestr user by username
   */
  findByUsername(username: string): Promise<RosreestrUserEntity | null>;

  /**
   * Create a new Rosreestr user
   */
  create(userData: Partial<RosreestrUserEntity>): Promise<RosreestrUserEntity>;

  /**
   * Update Rosreestr user
   */
  update(id: number, userData: Partial<RosreestrUserEntity>): Promise<RosreestrUserEntity>;

  /**
   * Soft delete Rosreestr user (sets deleted_at)
   */
  softDelete(id: number): Promise<void>;

  /**
   * Restore soft-deleted Rosreestr user
   */
  restore(id: number): Promise<void>;

  /**
   * Check if username exists
   */
  usernameExists(username: string): Promise<boolean>;
}
