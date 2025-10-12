import { map, type OperatorFunction } from 'rxjs';
import { mapErrorCodeToHttpException } from '../utils';
import { ErrorCode } from '@rosreestr-extracts/interfaces';

/**
 * Interface for gRPC response with error handling
 */
export interface GrpcResponse {
  error?: {
    error?: string;
    errorCode?: ErrorCode;
  };
}

/**
 * RxJS operator that checks gRPC response for errors and throws HTTP exception if found
 *
 * Usage:
 * ```typescript
 * this.authService.login({ email, password }).pipe(
 *   throwOnGrpcError()
 * )
 * ```
 *
 * This replaces the manual pattern:
 * ```typescript
 * const response = await firstValueFrom(this.authService.login(...));
 * throwIfError(response);
 * ```
 */
export function throwOnGrpcError<T extends GrpcResponse>(): OperatorFunction<T, T> {
  return map((response: T): T => {
    if (response?.error?.errorCode) {
      throw mapErrorCodeToHttpException(response.error.errorCode, response.error.error);
    }
    return response;
  });
}
