import { ErrorCode } from '@rosreestr-extracts/interfaces';

/**
 * Map ErrorCode to default error message
 * These are fallback messages, api-gateway can override them for localization
 */
export function getErrorText(errorCode: ErrorCode): string {
  const errorMessages: Partial<Record<ErrorCode, string>> = {
    [ErrorCode.ERROR_CODE_UNSPECIFIED]: '',

    // Validation errors (400)
    [ErrorCode.INVALID_INPUT]: 'Invalid input data',
    [ErrorCode.INVALID_EMAIL_FORMAT]: 'Invalid email format',
    [ErrorCode.INVALID_PASSWORD_FORMAT]: 'Invalid password format',
    [ErrorCode.PASSWORD_TOO_SHORT]: 'Password must be at least 8 characters long',
    [ErrorCode.MISSING_REQUIRED_FIELD]: 'Required field is missing',

    // Authentication errors (401)
    [ErrorCode.INVALID_CREDENTIALS]: 'Invalid email or password',
    [ErrorCode.INVALID_TOKEN]: 'Invalid or malformed token',
    [ErrorCode.TOKEN_EXPIRED]: 'Token has expired',

    // Authorization errors (403)
    [ErrorCode.USER_NOT_ACTIVE]: 'User account is not active',
    [ErrorCode.EMAIL_NOT_VERIFIED]: 'Email address is not verified',
    [ErrorCode.INSUFFICIENT_PERMISSIONS]: 'Insufficient permissions',

    // Resource errors (404/409)
    [ErrorCode.USER_NOT_FOUND]: 'User not found',
    [ErrorCode.USER_ALREADY_EXISTS]: 'User with this email already exists',
    [ErrorCode.REFRESH_TOKEN_NOT_FOUND]: 'Refresh token not found or invalid',

    // Server errors (500)
    [ErrorCode.INTERNAL_ERROR]: 'Internal server error',
    [ErrorCode.DATABASE_ERROR]: 'Database error occurred',
    [ErrorCode.HASH_ERROR]: 'Password hashing error',
  };

  return errorMessages[errorCode] || 'Unknown error';
}
