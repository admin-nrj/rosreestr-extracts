import { Processor, Process } from '@nestjs/bull';
import { Logger, Inject, OnModuleInit } from '@nestjs/common';
import { Job } from 'bull';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ORDER_QUEUE_NAME,
  ORDER_JOB_NAMES,
  QUEUE_CONFIG,
  OrderJobData,
} from '@rosreestr-extracts/queue';
import { RosreestrUserRepository } from '@rosreestr-extracts/dal';
import { CryptoService } from '@rosreestr-extracts/crypto';
import { OrdersServiceClient, ORDERS_SERVICE_NAME, ORDERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { getErrorMessage, getErrorStack } from '@rosreestr-extracts/utils';
import { cryptoConfig, appConfig } from '@rosreestr-extracts/config';
import { ConfigType } from '@nestjs/config';
import { OrderStatus } from '@rosreestr-extracts/constants';

/**
 * Order Processor
 * Processes orders from the queue using Rosreestr user credentials
 */
@Processor(ORDER_QUEUE_NAME)
export class OrderProcessor implements OnModuleInit {
  private readonly logger = new Logger(OrderProcessor.name);
  private ordersServiceClient: OrdersServiceClient;

  constructor(
    @Inject(ORDERS_PACKAGE_NAME) private readonly ordersGrpcClient: ClientGrpc,
    private readonly rosreestrUserRepository: RosreestrUserRepository,
    private readonly cryptoService: CryptoService,
    @Inject(cryptoConfig.KEY) private readonly cryptoCfg: ConfigType<typeof cryptoConfig>,
    @Inject(appConfig.KEY) private readonly appCfg: ConfigType<typeof appConfig>
  ) {}

  onModuleInit() {
    this.ordersServiceClient = this.ordersGrpcClient.getService<OrdersServiceClient>(ORDERS_SERVICE_NAME);
    this.logger.log(`OrderProcessor initialized for Rosreestr Username: ${this.appCfg.worker.rosreestrUserName}`);
  }

  @Process({
    name: ORDER_JOB_NAMES.PROCESS_ORDER,
    concurrency: QUEUE_CONFIG.CONCURRENCY.ORDER_PROCESSING,
  })
  async processOrder(job: Job<OrderJobData>): Promise<void> {
    const { orderId, cadNum, userId } = job.data;

    this.logger.log(
      `[Job ${job.id}] Processing order ${orderId} (cadNum: ${cadNum}) for user ${userId}`
    );

    try {
      // 1. Get Rosreestr user by username
      const rosreestrUser = await this.rosreestrUserRepository.findByUsername(this.appCfg.worker.rosreestrUserName);

      if (!rosreestrUser) {
        throw new Error(`Rosreestr user '${this.appCfg.worker.rosreestrUserName}' not found`);
      }

      // 2. Update order with rosreestr_user_id and status
      await this.updateOrderStatus(orderId, {
        rosreestrUserId: rosreestrUser.id,
        status: OrderStatus.PROCESSING,
      });

      // 3. Decrypt credentials
      const credentials = {
        username: rosreestrUser.username,
        guLogin: rosreestrUser.guLogin,
        password: await this.cryptoService.decrypt(rosreestrUser.passwordEncrypted, this.cryptoCfg.rrSecret),
      };

      this.logger.log(
        `[Job ${job.id}] Using Rosreestr credentials for user: ${credentials.username}`
      );

      // 4. Process order with Rosreestr API
      const result = await this.processWithRosreestrApi(cadNum, credentials);

      // 5. Update order with success status
      await this.updateOrderStatus(orderId, {
        status: OrderStatus.COMPLETED,
        isComplete: true,
        rosreestrOrderNum: result.orderNum,
        completedAt: new Date(),
      });

      this.logger.log(`[Job ${job.id}] Order ${orderId} processed successfully`);
    } catch (error) {
      this.logger.error(
        `[Job ${job.id}] Error processing order ${orderId}: ${getErrorMessage(error)}`,
        getErrorStack(error)
      );

      // Update order with error status
      await this.updateOrderStatus(orderId, {
        status: `${OrderStatus.ERROR_PREFIX}${getErrorMessage(error)}`
      });

      // Re-throw to trigger Bull retry
      throw error;
    }
  }

  /**
   * Update order status via gRPC
   */
  private async updateOrderStatus(orderId: number, updates: any): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.ordersServiceClient.updateOrder({
          id: orderId,
          ...updates,
        })
      );

      if (response.error) {
        throw new Error(`Failed to update order: ${response.error.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Process order with Rosreestr API
   * TODO: Implement actual Rosreestr API integration
   */
  private async processWithRosreestrApi(
    cadNum: string,
    credentials: { username: string; password: string; token?: string }
  ): Promise<{ orderNum: string }> {
    this.logger.log(`Processing with Rosreestr API - cadNum: ${cadNum}`);

    // TODO: Implement actual API calls to Rosreestr
    // For now, simulate processing with a delay
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Simulate successful processing
    const orderNum = `RR-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;

    return { orderNum };
  }
}
