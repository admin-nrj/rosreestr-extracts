import { RefreshTokenEntity } from '@rosreestr-extracts/entities';

/**
 * Refresh token repository interface
 */
export interface IRefreshTokenRepository {
  /**
   * Find refresh token by token string
   */
  findByToken(token: string): Promise<RefreshTokenEntity | null>;

  /**
   * Create new refresh token
   */
  create(tokenData: {
    userId: number;
    token: string;
    expiresAt: Date;
    userAgent?: string;
    ipAddress?: string;
  }): Promise<RefreshTokenEntity>;

  /**
   * Revoke refresh token
   */
  revoke(token: string): Promise<void>;

  /**
   * Revoke all user's refresh tokens
   */
  revokeAllUserTokens(userId: number): Promise<void>;

  /**
   * Delete expired tokens
   */
  deleteExpired(): Promise<void>;

  /**
   * Find all active tokens for a user
   */
  findActiveByUserId(userId: number): Promise<RefreshTokenEntity[]>;
}
