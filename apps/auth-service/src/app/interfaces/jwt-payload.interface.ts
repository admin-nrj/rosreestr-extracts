/**
 * JWT Access Token payload
 */
export interface JwtPayload {
  sub: number; // user ID
  email: string;
  name?: string;
  role: string;
}

/**
 * JWT Refresh Token payload
 */
export interface JwtRefreshPayload {
  sub: number; // user ID
  email: string;
}
