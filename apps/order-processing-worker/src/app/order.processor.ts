import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { ORDER_JOB_NAMES, ORDER_QUEUE_NAME, OrderJobData, QUEUE_CONFIG } from '@rosreestr-extracts/queue';
import { CryptoService } from '@rosreestr-extracts/crypto';
import {
  ORDERS_PACKAGE_NAME,
  ROSREESTR_USERS_PACKAGE_NAME
} from '@rosreestr-extracts/interfaces';
import { convertDatesToTimestamp, getErrorMessage, getErrorStack } from '@rosreestr-extracts/utils';
import { appConfig, cryptoConfig } from '@rosreestr-extracts/config';
import { ConfigType } from '@nestjs/config';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { OrderEntity } from '@rosreestr-extracts/entities';
import { RosreestrBrowserService } from './services/rosreestr-browser.service';
import { RosreestrAuthService } from './services/rosreestr-auth.service';
import { Page } from 'puppeteer';
import { RosreestrOrderService } from './services/rosreestr-order.service';
import { PlaceOrderResult } from './interfaces/place-order-result.interface';
import { BaseRosreestrProcessor } from './processors/base-rosreestr.processor';

/**
 * Order Processor
 * Processes orders from the queue using Rosreestr user credentials
 */
@Processor(ORDER_QUEUE_NAME)
export class OrderProcessor extends BaseRosreestrProcessor implements OnModuleDestroy {
  protected readonly logger = new Logger(OrderProcessor.name);

  constructor(
    @Inject(ORDERS_PACKAGE_NAME) ordersGrpcClient: ClientGrpc,
    @Inject(ROSREESTR_USERS_PACKAGE_NAME) rosreestrUsersGrpcClient: ClientGrpc,
    @Inject(appConfig.KEY) appCfg: ConfigType<typeof appConfig>,
    browserService: RosreestrBrowserService,
    @InjectQueue(ORDER_QUEUE_NAME) private readonly orderQueue: Queue<OrderJobData>,
    private readonly cryptoService: CryptoService,
    @Inject(cryptoConfig.KEY) private readonly cryptoCfg: ConfigType<typeof cryptoConfig>,
    private readonly authService: RosreestrAuthService,
    private readonly orderService: RosreestrOrderService
  ) {
    super(ordersGrpcClient, rosreestrUsersGrpcClient, appCfg, browserService);
  }

  async onModuleDestroy() {
    await this.browserService.shutdown();
  }

  @Process({
    name: ORDER_JOB_NAMES.PROCESS_ORDER,
    concurrency: QUEUE_CONFIG.CONCURRENCY.ORDER_PROCESSING,
  })
  async processOrder(job: Job<OrderJobData>): Promise<void> {
    const { orderId, cadNum, userId } = job.data;

    this.logger.log(`[Job ${job.id}] Processing order ${orderId} (cadNum: ${cadNum}) for user ${userId}`);

    // Ensure processor is fully initialized before processing
    await this.ensureInitialized();

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
      const result = await this.processWithRosreestrApi(orderId, cadNum, credentials);

      await this.updateOrder(orderId, {
        status: result.status,
        rosreestrOrderNum: result.orderNum,
        rosreestrRegisteredAt: new Date(),
        isComplete: result.isComplete,
      });

      this.logger.log(`[Job ${job.id}] Order ${orderId} processed successfully`);
    } catch (error) {
      const errorMessage = getErrorMessage(error);
      const errorStack = getErrorStack(error);

      this.logger.error(`[Job ${job.id}] Error processing order ${orderId}: ${errorMessage}`, errorStack);

      const configuredAttempts = job.opts?.attempts ?? QUEUE_CONFIG.DEFAULT_JOB_OPTIONS.attempts;
      const maxAttempts = typeof configuredAttempts === 'number' ? configuredAttempts : 1;
      const hasRetriesLeft = job.attemptsMade + 1  < maxAttempts;

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
    // Ensure initialized if rosreestrUserId is being used
    if (updates.rosreestrUserId !== undefined && !this.isInitialized) {
      await this.ensureInitialized();
    }

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
   * Process order with Rosreestr API using Puppeteer
   */
  private async processWithRosreestrApi(
    orderId: number,
    cadNum: string,
    credentials: { username: string; guLogin: string; password: string }
  ): Promise<PlaceOrderResult> {
    this.logger.log(`Processing with Rosreestr API - orderId: ${orderId}, cadNum: ${cadNum}`);

    let page: Page | null = null;

    try {
      page = await this.browserService.createPage();

      // Check authentication status
      const isAuthenticated = await this.authService.checkAuthStatus(page);

      // If not authenticated, perform login
      if (!isAuthenticated) {
        this.logger.log('Rosreestr user not authenticated, performing login...');
        await this.authService.login(page, credentials);
      }

      // After successful authentication, use fetch API to search for cadastral object
      this.logger.log(`Making fetch request for cadastral number: ${cadNum}`);
      const browserCookies = await this.browserService.getCookies();

      return await this.orderService.placeOrderByFetch(cadNum, browserCookies);
    } catch (error) {
      this.logger.error('Error in processWithRosreestrApi:', error);

      // Take screenshot on error
      await this.browserService.takeScreenshot(page, orderId, 'error')
        .catch(screenshotError => {
          this.logger.error('Failed to take screenshot:', screenshotError);
        })

      throw error;
    } finally {
      // Always close the page
      await this.browserService.closePage(page)
    }
  }
}
