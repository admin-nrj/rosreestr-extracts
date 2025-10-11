import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { ErrorCode, Error } from '@rosreestr-extracts/interfaces';
import { UserEntity } from '@rosreestr-extracts/entities';

export function getErrorName(error: unknown): string {
  if (error instanceof Error) return error.message;

  if (hasStringProperty(error, 'name')) {
    return error.name;
  }

  return 'Unknown error';
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;

  if (hasStringProperty(error, 'message')) {
    return error.message;
  }

  try {
    return JSON.stringify(error);
  } catch {
    return 'Unknown error occurred.';
  }
}

function hasStringProperty<K extends string>(x: unknown, prop: K): x is Record<K, string> {
  return (
    typeof x === 'object' &&
    x !== null &&
    prop in x &&
    typeof (x as Record<string, unknown>)[prop] === 'string'
  );
}

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

/**
 * Maps gRPC ErrorCode to appropriate HTTP exception
 * @param errorCode - Error code from gRPC service
 * @param message - Error message from service (optional, will use default if not provided)
 * @throws HttpException with appropriate status code
 */
export function mapErrorCodeToHttpException(
  errorCode: ErrorCode,
  message?: string
): HttpException {
  const errorMessage = message || getErrorText(errorCode);

  switch (errorCode) {
    // Validation errors (400 Bad Request)
    case ErrorCode.INVALID_INPUT:
    case ErrorCode.INVALID_EMAIL_FORMAT:
    case ErrorCode.INVALID_PASSWORD_FORMAT:
    case ErrorCode.PASSWORD_TOO_SHORT:
    case ErrorCode.MISSING_REQUIRED_FIELD:
      return new BadRequestException(errorMessage);

    // Authentication errors (401 Unauthorized)
    case ErrorCode.INVALID_CREDENTIALS:
    case ErrorCode.INVALID_TOKEN:
    case ErrorCode.TOKEN_EXPIRED:
      return new UnauthorizedException(errorMessage);

    // Authorization errors (403 Forbidden)
    case ErrorCode.USER_NOT_ACTIVE:
    case ErrorCode.EMAIL_NOT_VERIFIED:
    case ErrorCode.INSUFFICIENT_PERMISSIONS:
      return new ForbiddenException(errorMessage);

    // Resource not found (404 Not Found)
    case ErrorCode.USER_NOT_FOUND:
    case ErrorCode.REFRESH_TOKEN_NOT_FOUND:
      return new NotFoundException(errorMessage);

    // Conflict errors (409 Conflict)
    case ErrorCode.USER_ALREADY_EXISTS:
      return new ConflictException(errorMessage);

    // Server errors (500 Internal Server Error)
    case ErrorCode.INTERNAL_ERROR:
    case ErrorCode.DATABASE_ERROR:
    case ErrorCode.HASH_ERROR:
      return new InternalServerErrorException(errorMessage);

    // Default case - no error or unhandled error
    case ErrorCode.ERROR_CODE_UNSPECIFIED:
    default:
      return new InternalServerErrorException('Internal server error');
  }
}

/**
 * Checks if gRPC response has an error and throws appropriate HTTP exception
 * @param response - gRPC response with error and errorCode fields
 * @throws HttpException if error exists
 */
export function throwIfError(response: {
  error?: {
    error?: string;
    errorCode?: ErrorCode;
  };
}): void {
  if (response?.error?.errorCode) {
    throw mapErrorCodeToHttpException(response.error.errorCode, response.error.error);
  }
}

/**
 * Create error response with error code and message
 */
export function createErrorResponse(errorCode: ErrorCode): { error: Error } {
  const error = {
    message: getErrorText(errorCode),
    errorCode,
  }
  return { error };
}

/**
 * Map UserEntity to proto User message
 * @param entity - User entity from database
 * @returns Proto User message without sensitive data
 */
export function mapUserToProto(entity: UserEntity) {
  return {
    userId: entity.id,
    email: entity.email,
    name: entity.name || '',
    role: entity.role,
    isActive: entity.isActive,
    lastLoginAt: entity.lastLoginAt?.toISOString() || '',
    emailVerified: entity.emailVerified,
    payCount: entity.payCount,
    pbxExtension: entity.pbxExtension
  };
}
