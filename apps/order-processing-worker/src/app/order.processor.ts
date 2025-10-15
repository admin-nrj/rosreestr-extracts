import { Processor, Process, InjectQueue } from '@nestjs/bull';
import { Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ORDER_QUEUE_NAME, ORDER_JOB_NAMES, QUEUE_CONFIG, OrderJobData } from '@rosreestr-extracts/queue';
import { CryptoService } from '@rosreestr-extracts/crypto';
import {
  OrdersServiceClient,
  ORDERS_SERVICE_NAME,
  ORDERS_PACKAGE_NAME,
  RosreestrUsersServiceClient,
  ROSREESTR_USERS_SERVICE_NAME,
  ROSREESTR_USERS_PACKAGE_NAME,
} from '@rosreestr-extracts/interfaces';
import { convertDatesToTimestamp, getErrorMessage, getErrorStack } from '@rosreestr-extracts/utils';
import { cryptoConfig, appConfig } from '@rosreestr-extracts/config';
import { ConfigType } from '@nestjs/config';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { OrderEntity } from '@rosreestr-extracts/entities';

/**
 * Order Processor
 * Processes orders from the queue using Rosreestr user credentials
 */
@Processor(ORDER_QUEUE_NAME)
export class OrderProcessor implements OnModuleInit {
  private readonly logger = new Logger(OrderProcessor.name);
  private ordersServiceClient: OrdersServiceClient;
  private rosreestrUsersServiceClient: RosreestrUsersServiceClient;
  private rosreestrUserId: number;

  constructor(
    @Inject(ORDERS_PACKAGE_NAME) private readonly ordersGrpcClient: ClientGrpc,
    @Inject(ROSREESTR_USERS_PACKAGE_NAME) private readonly rosreestrUsersGrpcClient: ClientGrpc,
    @InjectQueue(ORDER_QUEUE_NAME) private readonly orderQueue: Queue<OrderJobData>,
    private readonly cryptoService: CryptoService,
    @Inject(cryptoConfig.KEY)
    private readonly cryptoCfg: ConfigType<typeof cryptoConfig>,
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>
  ) {}

  async onModuleInit() {
    this.ordersServiceClient = this.ordersGrpcClient.getService<OrdersServiceClient>(ORDERS_SERVICE_NAME);
    this.rosreestrUsersServiceClient =
      this.rosreestrUsersGrpcClient.getService<RosreestrUsersServiceClient>(ROSREESTR_USERS_SERVICE_NAME);

    // Verify Rosreestr user exists on startup via gRPC
    try {
      const response = await firstValueFrom(
        this.rosreestrUsersServiceClient.getRosreestrUserByUsername({
          username: this.appCfg.worker.rosreestrUserName,
        })
      );

      if (response.error || !response.rosreestrUser) {
        const errorMsg = `Rosreestr user '${this.appCfg.worker.rosreestrUserName}' not found. Service cannot start. ${
          response.error?.message || ''
        }`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      this.rosreestrUserId = response.rosreestrUser.id!;
      this.logger.log(
        `OrderProcessor initialized for Rosreestr User: ${
          response.rosreestrUser.username} (ID: ${response.rosreestrUser.id})`
      );
    } catch (error) {
      this.logger.error('Failed to initialize OrderProcessor:', error);
      throw error;
    }
  }

  @Process({
    name: ORDER_JOB_NAMES.PROCESS_ORDER,
    concurrency: QUEUE_CONFIG.CONCURRENCY.ORDER_PROCESSING,
  })
  async processOrder(job: Job<OrderJobData>): Promise<void> {
    const { orderId, cadNum, userId } = job.data;

    this.logger.log(`[Job ${job.id}] Processing order ${orderId} (cadNum: ${cadNum}) for user ${userId}`);

    try {
      // 1. Update order with rosreestr_user_id and status
      await this.updateOrder(orderId, {
        rosreestrUserId: this.rosreestrUserId,
        status: OrderStatus.PROCESSING,
      });

      // 2. Get fresh Rosreestr user data with credentials via gRPC
      const userResponse = await firstValueFrom(
        this.rosreestrUsersServiceClient.getRosreestrUser({ id: this.rosreestrUserId })
      );

      if (userResponse.error || !userResponse.rosreestrUser) {
        throw new Error(
          `Rosreestr user with ID ${this.rosreestrUserId} not found: ${userResponse.error?.message || ''}`
        );
      }

      const rosreestrUser = userResponse.rosreestrUser;

      // 3. Decrypt credentials
      const credentials = {
        username: rosreestrUser.username,
        guLogin: rosreestrUser.guLogin,
        password: await this.cryptoService.decrypt(rosreestrUser.passwordEncrypted, this.cryptoCfg.rrSecret),
      };

      this.logger.log(`[Job ${job.id}] Using Rosreestr credentials for user: ${credentials.username}`);

      // 4. Process order with Rosreestr API
      const result = await this.processWithRosreestrApi(cadNum, credentials);

      // 5. Update order with success status
      await this.updateOrder(orderId, {
        status: OrderStatus.COMPLETED,
        isComplete: true,
        rosreestrOrderNum: result.orderNum,
        completedAt: new Date(),
      });

      this.logger.log(`[Job ${job.id}] Order ${orderId} processed successfully`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);

      this.logger.error(`[Job ${job.id}] Error processing order ${orderId}: ${errorMessage}`, errorStack);

      const configuredAttempts = job.opts?.attempts ?? QUEUE_CONFIG.DEFAULT_JOB_OPTIONS.attempts;
      const maxAttempts = typeof configuredAttempts === 'number' ? configuredAttempts : 1;
      const hasRetriesLeft = job.attemptsMade < maxAttempts;

      await this.updateOrder(orderId, {
        status: `${OrderStatus.ERROR_PREFIX}${errorMessage}`,
        rosreestrUserId: null,
      });

      if (hasRetriesLeft) {
        // Re-throw to trigger Bull retry
        this.logger.warn(`[Job ${job.id}] Retrying (attempt ${job.attemptsMade + 1}/${maxAttempts})...`);
        throw error;
      }

      await this.handleAttemptsExhausted(job);
    }
  }

  /**
   * Update order status via gRPC
   */
  private async updateOrder(orderId: number, updates: Partial<OrderEntity>): Promise<void> {
    this.logger.log('[updateOrder] update', updates);
    try {
      const response = await firstValueFrom(
        this.ordersServiceClient.updateOrder(
          convertDatesToTimestamp({
            id: orderId,
            ...updates,
          })
        )
      );

      this.logger.log('[updateOrder] response', response);

      if (response.error) {
        throw new Error(`Failed to update order: ${response.error.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Handle exhausted retry attempts by requeuing the order at the tail of the queue.
   */
  private async handleAttemptsExhausted(job: Job<OrderJobData>): Promise<void> {
    const { orderId, cadNum } = job.data;

    this.logger.warn(
      `[cadNum ${cadNum}] Max attempts reached for order ${orderId}. Requeueing at the end of the queue.`
    );

    await this.updateOrder(orderId, {
      status: OrderStatus.QUEUED,
      isComplete: false,
    });

    await this.orderQueue.add(ORDER_JOB_NAMES.PROCESS_ORDER, job.data, { ...QUEUE_CONFIG.DEFAULT_JOB_OPTIONS });

    this.logger.log(`[Job ${job.id}] Order ${orderId} queued for another retry after exhausting attempts.`);
  }

  /**
   * Process order with Rosreestr API
   * TODO: Implement actual Rosreestr API integration
   */
  private async processWithRosreestrApi(
    cadNum: string,
    credentials: { username: string; guLogin: string; password: string }
  ): Promise<{ orderNum: string }> {
    this.logger.log(`Processing with Rosreestr API - cadNum: ${cadNum}`);

    // TODO: Implement actual API calls to Rosreestr
    // For now, simulate processing with a delay
    await new Promise((resolve) => setTimeout(resolve, 3000));

    // Simulate successful processing
    const orderNum = `RR-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    return { orderNum };
  }
}
