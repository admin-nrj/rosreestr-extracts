import { Logger, OnModuleInit, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { Page, Cookie } from 'puppeteer';
import {
  ORDERS_PACKAGE_NAME,
  ORDERS_SERVICE_NAME,
  OrdersServiceClient,
  ROSREESTR_USERS_PACKAGE_NAME,
  ROSREESTR_USERS_SERVICE_NAME,
  RosreestrUsersServiceClient,
} from '@rosreestr-extracts/interfaces';
import { appConfig, cryptoConfig } from '@rosreestr-extracts/config';
import { RosreestrBrowserService } from '../services/rosreestr-browser.service';
import { RosreestrAuthService } from '../services/rosreestr-auth.service';
import { CryptoService } from '@rosreestr-extracts/crypto';

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
    @Inject(cryptoConfig.KEY) private readonly cryptoCfg: ConfigType<typeof cryptoConfig>,
    private readonly cryptoService: CryptoService,
    protected readonly browserService: RosreestrBrowserService,
    protected readonly authService: RosreestrAuthService,
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

  /**
   * Get Rosreestr user credentials
   * @returns Decrypted credentials
   */
  protected async getCredentials() {
    const userResponse = await firstValueFrom(
      this.rosreestrUsersServiceClient.getRosreestrUser({ id: this.rosreestrUserId })
    );

    if (userResponse.error || !userResponse.rosreestrUser) {
      throw new Error(`Failed to get Rosreestr user: ${userResponse.error?.message}`);
    }

    const rosreestrUser = userResponse.rosreestrUser;

    return {
      username: rosreestrUser.username,
      guLogin: rosreestrUser.guLogin,
      password: await this.cryptoService.decrypt(rosreestrUser.passwordEncrypted, this.cryptoCfg.rrSecret),
    };
  }

  /**
   * Ensure page is authenticated and return browser cookies
   * Thread-safe: multiple concurrent calls will wait for the same authentication
   *
   * @param page - Puppeteer page instance
   * @returns Browser cookies for authenticated session
   */
  protected async ensureAuthenticatedPage(page: Page): Promise<Cookie[]> {
    // Get credentials
    const credentials = await this.getCredentials();

    // Ensure authentication (thread-safe)
    await this.authService.ensureAuthenticated(page, credentials);

    // Return browser cookies
    return await this.browserService.getCookies();
  }
}
