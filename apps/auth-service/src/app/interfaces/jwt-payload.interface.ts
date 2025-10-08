import { UserRole as EntityUserRole } from '@rosreestr-extracts/entities';
import { User } from '@rosreestr-extracts/interfaces';

/**
 * JWT Access Token payload
 */
export interface JwtPayload {
  sub: number; // user ID
  email: string;
  name?: string;
  role: EntityUserRole;
}

/**
 * JWT Refresh Token payload
 */
export interface JwtRefreshPayload {
  sub: number; // user ID
  email: string;
}

/**
 * Token validation response (internal service response)
 */
export interface ValidateTokenResponse {
  valid: boolean;
  user: User | undefined;
  error: string | undefined;
}
