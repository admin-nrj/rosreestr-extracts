import {
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  NotFoundException,
  ConflictException,
  InternalServerErrorException,
  HttpException,
} from '@nestjs/common';
import { ErrorCode } from '@rosreestr-extracts/interfaces';
import { getErrorText } from '@rosreestr-extracts/utils';

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
  if (response.error.errorCode) {
    throw mapErrorCodeToHttpException(response.error.errorCode, response.error.error);
  }
}
