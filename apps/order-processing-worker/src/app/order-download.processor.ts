import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { Cron } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { Page } from 'puppeteer';
import {
  ORDERS_PACKAGE_NAME,
  ROSREESTR_USERS_PACKAGE_NAME,
  Order,
} from '@rosreestr-extracts/interfaces';
import { appConfig, cryptoConfig } from '@rosreestr-extracts/config';
import { CryptoService } from '@rosreestr-extracts/crypto';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { convertDatesToTimestamp, getErrorMessage, randomPause } from '@rosreestr-extracts/utils';
import { RosreestrBrowserService } from './services/rosreestr-browser.service';
import { RosreestrAuthService } from './services/rosreestr-auth.service';
import { RosreestrOrderDownloaderService } from './services/rosreestr-order-downloader.service';
import { WorkerScheduleService } from './services/worker-schedule.service';
import { Cookie } from 'puppeteer';
import { BaseRosreestrProcessor } from './processors/base-rosreestr.processor';

/**
 * Order Status Checker Processor
 * Runs on cron schedule to check registered orders and download ready files
 */
@Injectable()
export class OrderDownloadProcessor extends BaseRosreestrProcessor {
  protected readonly logger = new Logger(OrderDownloadProcessor.name);
  private isRunning = false;

  constructor(
    @Inject(ORDERS_PACKAGE_NAME) ordersGrpcClient: ClientGrpc,
    @Inject(ROSREESTR_USERS_PACKAGE_NAME) rosreestrUsersGrpcClient: ClientGrpc,
    @Inject(appConfig.KEY) appCfg: ConfigType<typeof appConfig>,
    browserService: RosreestrBrowserService,
    @Inject(cryptoConfig.KEY) cryptoCfg: ConfigType<typeof cryptoConfig>,
    authService: RosreestrAuthService,
    private readonly orderDownloaderService: RosreestrOrderDownloaderService,
    cryptoService: CryptoService,
    private readonly workerScheduleService: WorkerScheduleService
  ) {
    super(ordersGrpcClient, rosreestrUsersGrpcClient, appCfg, cryptoCfg, cryptoService, browserService, authService);
  }

  /**
   * Cron job to check order statuses
   * Runs every 30 minutes
   */
  @Cron('*/30 * * * *')
  async handleCron() {
    // Ensure processor is fully initialized before processing
    await this.ensureInitialized();

    const schedule = await this.workerScheduleService.getSchedule('order-status-checker');

    if (!schedule) {
      this.logger.warn('No schedule found for order-status-checker');
      return;
    }

    // Check if worker is active
    if (!schedule.isActive) {
      this.logger.log('Worker is not active, skipping...');
      return;
    }

    // Check if within active interval
    if (!this.workerScheduleService.isActiveInterval(schedule)) {
      this.logger.log('Outside active interval, skipping...');
      return;
    }

    // Check if previous run completed
    if (!this.workerScheduleService.canRun(schedule)) {
      this.logger.warn('Previous run not completed yet, skipping...');
      return;
    }

    // Check in-memory flag
    if (this.isRunning) {
      this.logger.warn('Already running (in-memory flag), skipping...');
      return;
    }

    await this.checkOrderStatuses();
  }

  /**
   * Main logic to check order statuses and download files
   */
  private async checkOrderStatuses() {
    this.isRunning = true;
    await this.workerScheduleService.markRunStart('order-status-checker');

    let page: Page | null = null;

    try {
      this.logger.log('Starting order status check...');

      // 1. Get list of registered orders to check
      const response = await firstValueFrom(this.ordersServiceClient.getRegisteredOrders({}));

      if (response.error) {
        throw new Error(`Failed to get registered orders: ${response.error.message}`);
      }

      const orders = response.orders;

      if (!orders || orders.length === 0) {
        this.logger.log('No registered orders to check');
        return;
      }

      this.logger.log(`Found ${orders.length} registered orders to check`);

      page = await this.browserService.createPage();

      // Ensure authentication and get cookies
      const browserCookies = await this.ensureAuthenticatedPage(page);

      let checkedCount = 0;

      for (const order of orders) {
        try {
          await this.checkSingleOrder(order, browserCookies);
          checkedCount++;
          await randomPause();
        } catch (error) {
          this.logger.error(`Error checking order ${order.id}:`, getErrorMessage(error));
        }
      }

      this.logger.log(`Order status check completed. Checked: ${checkedCount} orders`);
    } catch (error) {
      this.logger.error('Error in checkOrderStatuses:', getErrorMessage(error));

      if (page) {
        await this.browserService
          .takeScreenshot(page, 0, 'status-checker-error')
          .catch((e) => this.logger.error('Screenshot failed:', e));
      }
    } finally {
      if (page) {
        await this.browserService.closePage(page);
      }

      this.isRunning = false;
      await this.workerScheduleService.markRunComplete('order-status-checker');
    }
  }

  /**
   * Check single order status and download if ready
   * @param order - Order to check (gRPC Order type)
   * @param cookies - Browser cookies for authentication
   */
  private async checkSingleOrder(order: Order, cookies: Cookie[]) {
    try {
      this.logger.log(`Checking order ${order.id} (${order.rosreestrOrderNum})...`);

      const statusResult = await this.orderDownloaderService.checkOrderStatus(order.rosreestrOrderNum || '', cookies);

      if (statusResult.isReady) {
        this.logger.log(`Order ${order.id} is ready, downloading files...`);

        // Download files to DOWNLOADS_DIR/orders/
        const storagePath = await this.orderDownloaderService.downloadOrderFiles(
          order.rosreestrOrderNum || '',
          statusResult.applicationId,
          cookies
        );

        // Update order status
        await this.updateOrder(order.id || 0, {
          status: OrderStatus.DOWNLOADED,
          isComplete: true,
          completedAt: new Date(),
          lastCheckedAt: new Date(),
        });

        this.logger.log(`Order ${order.id} completed and files saved to ${storagePath}`);
      } else {
        // Not ready yet
        this.logger.log(`Order ${order.id} not ready yet (status: ${statusResult.status})`);

        await this.updateOrder(order.id || 0, {
          lastCheckedAt: new Date(),
        });
      }
    } catch (error) {
      this.logger.error(`Error checking order ${order.id}:`, getErrorMessage(error));
      throw error;
    }
  }

  /**
   * Update order via gRPC
   * @param orderId - Order ID
   * @param updates - Fields to update (Date objects will be converted to Timestamps)
   */
  private async updateOrder(
    orderId: number,
    updates: Partial<
      Omit<
        Order,
        | 'completedAt'
        | 'lastCheckedAt'
        | 'rosreestrRegisteredAt'
        | 'rosreestrRegistrationStartedAt'
        | 'createdAt'
        | 'updatedAt'
      >
    > & {
      completedAt?: Date;
      lastCheckedAt?: Date;
      rosreestrRegisteredAt?: Date;
      rosreestrRegistrationStartedAt?: Date;
      createdAt?: Date;
      updatedAt?: Date;
    }
  ): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.ordersServiceClient.updateOrder(
          convertDatesToTimestamp({
            id: orderId,
            ...updates,
          })
        )
      );

      if (response.error) {
        throw new Error(`Failed to update order: ${response.error.message}`);
      }

      this.logger.log(`Order ${orderId} updated successfully`);
    } catch (error) {
      this.logger.error(`Failed to update order ${orderId}:`, getErrorMessage(error));
      throw error;
    }
  }
}
