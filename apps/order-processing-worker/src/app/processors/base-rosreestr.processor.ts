import { Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import {
  ORDERS_PACKAGE_NAME,
  ORDERS_SERVICE_NAME,
  OrdersServiceClient,
  ROSREESTR_USERS_PACKAGE_NAME,
  ROSREESTR_USERS_SERVICE_NAME,
  RosreestrUsersServiceClient,
} from '@rosreestr-extracts/interfaces';
import { appConfig } from '@rosreestr-extracts/config';
import { RosreestrBrowserService } from '../services/rosreestr-browser.service';

/**
 * Base abstract class for Rosreestr processors
 * Provides shared initialization logic for Rosreestr user verification and browser setup
 */
export abstract class BaseRosreestrProcessor implements OnModuleInit {
  protected abstract readonly logger: Logger;
  protected ordersServiceClient: OrdersServiceClient;
  protected rosreestrUsersServiceClient: RosreestrUsersServiceClient;
  protected rosreestrUserId: number;
  protected initializationPromise: Promise<void>;
  protected isInitialized = false;

  constructor(
    @Inject(ORDERS_PACKAGE_NAME) protected readonly ordersGrpcClient: ClientGrpc,
    @Inject(ROSREESTR_USERS_PACKAGE_NAME) protected readonly rosreestrUsersGrpcClient: ClientGrpc,
    @Inject(appConfig.KEY) protected readonly appCfg: ConfigType<typeof appConfig>,
    protected readonly browserService: RosreestrBrowserService
  ) {}

  async onModuleInit() {
    this.initializationPromise = this.initialize();
    await this.initializationPromise;
  }

  /**
   * Initialize the processor with Rosreestr user and browser
   */
  private async initialize(): Promise<void> {
    this.logger.log(`Starting ${this.constructor.name} initialization...`);

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

      if (response.error || !response.rosreestrUser || !response.rosreestrUser.id) {
        const errorMsg = `Rosreestr user '${this.appCfg.worker.rosreestrUserName}' not found. Service cannot start. ${
          response.error?.message || ''
        }`;
        this.logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      this.rosreestrUserId = response.rosreestrUser.id;
      this.logger.log(
        `${this.constructor.name} initialized for Rosreestr User: ` +
          `${response.rosreestrUser.username} (ID: ${response.rosreestrUser.id})`
      );

      // Initialize Puppeteer browser
      await this.browserService.initialize();

      this.isInitialized = true;
      this.logger.log(`${this.constructor.name} initialization completed successfully`);
    } catch (error) {
      this.logger.error(`Failed to initialize ${this.constructor.name}:`, error);
      throw error;
    }
  }

  /**
   * Wait for initialization to complete
   * This ensures that rosreestrUserId and browser are ready
   */
  protected async ensureInitialized(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    this.logger.log(`Waiting for ${this.constructor.name} initialization to complete...`);
    await this.initializationPromise;

    if (!this.isInitialized) {
      throw new Error(`${this.constructor.name} initialization failed`);
    }
  }
}
