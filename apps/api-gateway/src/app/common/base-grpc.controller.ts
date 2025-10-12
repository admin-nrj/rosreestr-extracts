import { OnModuleInit } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { Observable, firstValueFrom } from 'rxjs';
import { throwOnGrpcError } from '@rosreestr-extracts/utils';

/**
 * Base controller class for gRPC communication with automatic error handling
 *
 * Usage:
 * ```typescript
 * @Controller('users')
 * export class UsersController extends BaseGrpcController<UsersServiceClient> {
 *   constructor(@Inject(USERS_PACKAGE_NAME) client: ClientGrpc) {
 *     super(client, USERS_SERVICE_NAME);
 *   }
 *
 *   async getUser(id: number) {
 *     return this.callGrpc(this.service.getUser({ id }));
 *   }
 * }
 * ```
 */
export abstract class BaseGrpcController<TService extends object = any> implements OnModuleInit {
  /**
   * gRPC service client instance
   * Available after onModuleInit is called
   */
  protected service!: TService;

  /**
   * @param client - gRPC client from @Inject
   * @param serviceName - Name of the gRPC service to get from client
   */
  constructor(
    private readonly client: ClientGrpc,
    private readonly serviceName: string
  ) {}

  /**
   * Initialize gRPC service client
   */
  onModuleInit(): void {
    this.service = this.client.getService<TService>(this.serviceName);
  }

  /**
   * Helper method to call gRPC service with automatic error handling
   * Combines firstValueFrom + throwOnGrpcError into single call
   *
   * @param observable - RxJS Observable from gRPC service
   * @returns Promise with the response data
   * @throws HttpException if gRPC response contains error
   */
  protected async callGrpc<T>(observable: Observable<T>): Promise<T> {
    return firstValueFrom(observable.pipe(throwOnGrpcError()));
  }
}
