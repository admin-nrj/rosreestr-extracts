import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Inject, Logger, OnModuleDestroy } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { ClientGrpc } from '@nestjs/microservices';
import {
  CheckAndDownloadOrderJobData,
  ORDER_JOB_NAMES,
  ORDER_QUEUE_NAME,
  OrderJobData,
} from '@rosreestr-extracts/queue';
import { CryptoService } from '@rosreestr-extracts/crypto';
import { ORDERS_PACKAGE_NAME, ROSREESTR_USERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { getErrorMessage } from '@rosreestr-extracts/utils';
import { appConfig, cryptoConfig } from '@rosreestr-extracts/config';
import { ConfigType } from '@nestjs/config';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { RosreestrBrowserService } from './services/rosreestr-browser.service';
import { Page } from 'puppeteer';
import { RosreestrOrderService } from './services/rosreestr-order.service';
import { RosreestrAuthService } from './services/rosreestr-auth.service';
import { PlaceOrderResult } from './interfaces/place-order-result.interface';
import { BaseOrderProcessor } from './processors/base-order.processor';

/**
 * Order Processor
 * Processes orders from the queue using Rosreestr user credentials
 */
@Processor(ORDER_QUEUE_NAME)
export class OrderProcessor extends BaseOrderProcessor implements OnModuleDestroy {
  protected readonly logger = new Logger(OrderProcessor.name);

  constructor(
    @Inject(ORDERS_PACKAGE_NAME) ordersGrpcClient: ClientGrpc,
    @Inject(ROSREESTR_USERS_PACKAGE_NAME) rosreestrUsersGrpcClient: ClientGrpc,
    @Inject(appConfig.KEY) appCfg: ConfigType<typeof appConfig>,
    browserService: RosreestrBrowserService,
    @InjectQueue(ORDER_QUEUE_NAME) private readonly orderQueue: Queue<OrderJobData | CheckAndDownloadOrderJobData>,
    cryptoService: CryptoService,
    @Inject(cryptoConfig.KEY) cryptoCfg: ConfigType<typeof cryptoConfig>,
    authService: RosreestrAuthService,
    private readonly orderService: RosreestrOrderService
  ) {
    super(ordersGrpcClient, rosreestrUsersGrpcClient, appCfg, cryptoCfg, cryptoService, browserService, authService);
  }

  async onModuleDestroy() {
    await this.browserService.shutdown();
  }

  @Process(ORDER_JOB_NAMES.PROCESS_ORDER)
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

      // 4. Process order with Rosreestr API
      const result = await this.processWithRosreestrApi(orderId, cadNum);

      await this.updateOrder(orderId, {
        status: result.status,
        rosreestrOrderNum: result.orderNum,
        rosreestrRegisteredAt: new Date(),
        isComplete: result.isComplete,
      });

      // Add job to check and download order
      await this.orderQueue.add(
        ORDER_JOB_NAMES.CHECK_AND_DOWNLOAD_ORDER,
        {
          orderId,
          rosreestrOrderNum: result.orderNum,
        },
        {
          delay: 60000, // Wait 1 minute before first check
        }
      );

      this.logger.log(
        `[Job ${job.id}] Order ${orderId} processed successfully. ` + `Added to CHECK_AND_DOWNLOAD_ORDER queue.`
      );
    } catch (error) {
      const errorMessage = getErrorMessage(error);

      await this.updateOrder(orderId, {
        status: `${OrderStatus.ERROR_PREFIX}${errorMessage}`,
        rosreestrUserId: null,
      });

      await this.handleJobError(job, orderId, error as Error, async (j) => {
        await this.handleAttemptsExhausted(j);
      });
    }
  }

  /**
   * Handle exhausted retry attempts by requeuing the order at the tail of the queue.
   */
  private async handleAttemptsExhausted(job: Job<OrderJobData>): Promise<void> {
    const { orderId } = job.data;
    await this.requeueAtEnd(job, this.orderQueue, ORDER_JOB_NAMES.PROCESS_ORDER, orderId);
  }

  /**
   * Process order with Rosreestr API using Puppeteer
   */
  private async processWithRosreestrApi(orderId: number, cadNum: string): Promise<PlaceOrderResult> {
    this.logger.log(`Processing with Rosreestr API - orderId: ${orderId}, cadNum: ${cadNum}`);

    let page: Page | null = null;

    try {
      page = await this.browserService.createPage();

      // Ensure authentication and get cookies
      const browserCookies = await this.ensureAuthenticatedPage(page);
      this.logger.log(`Making fetch request for cadastral number: ${cadNum}`);

      return await this.orderService.placeOrderByFetch(cadNum, browserCookies);
    } catch (error) {
      this.logger.error('Error in processWithRosreestrApi:', error);

      // Take screenshot on error
      await this.browserService.takeScreenshot(page, orderId, 'error').catch((screenshotError) => {
        this.logger.error('Failed to take screenshot:', screenshotError);
      });

      throw error;
    } finally {
      // Always close the page
      await this.browserService.closePage(page);
    }
  }
}
