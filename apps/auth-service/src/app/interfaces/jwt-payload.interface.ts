import { UserRole as EntityUserRole } from '@rosreestr-extracts/entities';

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
