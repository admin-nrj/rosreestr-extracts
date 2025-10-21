import { Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { InjectQueue, Process, Processor } from '@nestjs/bull';
import { Job, Queue } from 'bull';
import { Page } from 'puppeteer';
import {
  ORDERS_PACKAGE_NAME,
  ROSREESTR_USERS_PACKAGE_NAME,
} from '@rosreestr-extracts/interfaces';
import { appConfig, cryptoConfig } from '@rosreestr-extracts/config';
import { CryptoService } from '@rosreestr-extracts/crypto';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { RosreestrBrowserService } from './services/rosreestr-browser.service';
import { RosreestrAuthService } from './services/rosreestr-auth.service';
import { RosreestrOrderDownloaderService } from './services/rosreestr-order-downloader.service';
import { FileValidatorService } from './services/file-validator.service';
import { Cookie } from 'puppeteer';
import { BaseOrderProcessor } from './processors/base-order.processor';
import { ORDER_JOB_NAMES, ORDER_QUEUE_NAME, CheckAndDownloadOrderJobData } from '@rosreestr-extracts/queue';
import { randomPause } from '@rosreestr-extracts/utils';

/**
 * Order Status Checker Processor
 * Processes orders from queue to check status and download ready files
 */
@Processor(ORDER_QUEUE_NAME)
export class OrderDownloadProcessor extends BaseOrderProcessor {
  protected readonly logger = new Logger(OrderDownloadProcessor.name);

  constructor(
    @Inject(ORDERS_PACKAGE_NAME) ordersGrpcClient: ClientGrpc,
    @Inject(ROSREESTR_USERS_PACKAGE_NAME) rosreestrUsersGrpcClient: ClientGrpc,
    @Inject(appConfig.KEY) appCfg: ConfigType<typeof appConfig>,
    browserService: RosreestrBrowserService,
    @Inject(cryptoConfig.KEY) cryptoCfg: ConfigType<typeof cryptoConfig>,
    authService: RosreestrAuthService,
    private readonly orderDownloaderService: RosreestrOrderDownloaderService,
    private readonly fileValidatorService: FileValidatorService,
    cryptoService: CryptoService,
    @InjectQueue(ORDER_QUEUE_NAME) private readonly orderQueue: Queue<CheckAndDownloadOrderJobData>
  ) {
    super(ordersGrpcClient, rosreestrUsersGrpcClient, appCfg, cryptoCfg, cryptoService, browserService, authService);
  }

  /**
   * Process job to check order status and download if ready
   */
  @Process(ORDER_JOB_NAMES.CHECK_AND_DOWNLOAD_ORDER)
  async checkAndDownloadOrder(job: Job<CheckAndDownloadOrderJobData>): Promise<void> {
    const { orderId, rosreestrOrderNum } = job.data;

    this.logger.log(`[Job ${job.id}] Checking order ${orderId} status`);

    // Ensure processor is fully initialized before processing
    await this.ensureInitialized();

    let page: Page | null = null;

    try {
      // Create browser page and authenticate
      page = await this.browserService.createPage();
      const browserCookies = await this.ensureAuthenticatedPage(page);

      // Check and download order using rosreestrOrderNum from job data
      await this.checkSingleOrder(orderId, rosreestrOrderNum, browserCookies);

      this.logger.log(`[Job ${job.id}] Order ${orderId} check completed successfully`);
    } catch (error) {
      if (page) {
        await this.browserService
          .takeScreenshot(page, orderId, 'download-error')
          .catch((e) => this.logger.error('Screenshot failed:', e));
      }

      await this.handleJobError(job, orderId, error as Error, async (j) => {
        await this.handleAttemptsExhausted(j);
      });
    } finally {
      if (page) {
        await this.browserService.closePage(page);
      }
    }
  }

  /**
   * Handle exhausted retry attempts by requeuing the order at the beginning of the queue.
   */
  private async handleAttemptsExhausted(job: Job<CheckAndDownloadOrderJobData>): Promise<void> {
    const { orderId } = job.data;
    await this.requeueAtBeginning(job, this.orderQueue, ORDER_JOB_NAMES.CHECK_AND_DOWNLOAD_ORDER, orderId);
  }

  /**
   * Check single order status and download if ready
   * @param orderId - Order ID
   * @param rosreestrOrderNum - Rosreestr order number
   * @param cookies - Browser cookies for authentication
   */
  private async checkSingleOrder(orderId: number, rosreestrOrderNum: string, cookies: Cookie[]) {
    this.logger.log(`Checking order ${orderId} (${rosreestrOrderNum})...`);
    // Random delay 5-10 seconds to avoid checking orders too frequently
    await randomPause(5000, 10000)

    const statusResult = await this.orderDownloaderService.checkOrderStatus(rosreestrOrderNum, cookies);

    if (statusResult.isReady) {
      this.logger.log(`Order ${orderId} is ready, downloading files...`);

      // Download files to DOWNLOADS_DIR/orders/
      const storagePath = await this.orderDownloaderService.downloadOrderFiles(
        rosreestrOrderNum,
        statusResult.applicationId,
        cookies
      );

      // Validate downloaded file
      this.logger.log(`Validating downloaded file: ${storagePath}`);
      const validationResult = await this.fileValidatorService.validateZipFile(storagePath);

      if (!validationResult.isValid) {
        this.logger.error(
          `File validation failed for order ${orderId}: ${validationResult.error}`
        );
        throw new Error(`File validation failed: ${validationResult.error}`);
      }

      this.logger.log(`File validation passed for order ${orderId} (size: ${validationResult.fileSize} bytes)`);

      // Update order status
      await this.updateOrder(orderId, {
        status: OrderStatus.DOWNLOADED,
        isComplete: true,
        completedAt: new Date(),
        lastCheckedAt: new Date(),
      });

      this.logger.log(`Order ${orderId} completed and files saved to ${storagePath}`);
    } else {
      // Not ready yet
      this.logger.log(`Order ${orderId} not ready yet (status: ${statusResult.status})`);

      await this.updateOrder(orderId, {
        lastCheckedAt: new Date(),
      });
    }
  }
}
