import { Injectable, Logger, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { appConfig } from '@rosreestr-extracts/config';
import {
  BROWSER_ARGS,
  DEFAULT_VIEWPORT,
} from '../common/puppeteer-options.constants';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { Browser, Page } from 'puppeteer';
import { executablePath } from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

puppeteer.use(StealthPlugin());

/**
 * Service for managing Puppeteer browser instance
 * Implements singleton pattern for browser, creates new pages for each order
 */
@Injectable()
export class RosreestrBrowserService implements OnModuleDestroy {
  private readonly logger = new Logger(RosreestrBrowserService.name);
  private browser: Browser | null = null;
  private screenshotsDir: string;
  private initializationPromise: Promise<void> | null = null;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>
  ) {
    this.screenshotsDir = this.appCfg.worker.puppeteer.screenshotsDir;
  }

  /**
   * Initialize browser instance (thread-safe singleton)
   * Multiple concurrent calls will wait for the same initialization
   */
  async initialize(): Promise<void> {
    // If already initialized, return immediately
    if (this.browser) {
      this.logger.debug('Browser already initialized');
      return;
    }

    // If initialization is in progress, wait for it
    if (this.initializationPromise !== null) {
      this.logger.debug('Browser initialization in progress, waiting...');
      return this.initializationPromise;
    }

    // Start initialization and store the promise
    this.initializationPromise = this.doInitialize();

    try {
      await this.initializationPromise;
    } finally {
      // Clear the promise after completion (success or failure)
      this.initializationPromise = null;
    }
  }

  /**
   * Actual initialization logic
   */
  private async doInitialize(): Promise<void> {
    try {
      this.logger.log('Initializing Puppeteer browser...');
      this.logger.log(`Headless mode: ${this.appCfg.worker.puppeteer.headless}`);

      this.browser = await puppeteer.launch({
        headless: this.appCfg.worker.puppeteer.headless,
        executablePath: executablePath(),
        defaultViewport: DEFAULT_VIEWPORT,
        args: [...BROWSER_ARGS],
      });

      // Ensure screenshots directory exists
      if (!fs.existsSync(this.screenshotsDir)) {
        fs.mkdirSync(this.screenshotsDir, { recursive: true });
        this.logger.log(`Created screenshots directory: ${this.screenshotsDir}`);
      }

      this.logger.log('Puppeteer browser initialized successfully');
    } catch (error) {
      this.logger.error('Failed to initialize Puppeteer browser:', error);
      this.browser = null; // Reset on failure
      throw error;
    }
  }

  /**
   * Get browser instance
   * @throws Error if browser not initialized
   */
  getBrowser(): Browser {
    if (!this.browser) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    return this.browser;
  }

  /**
   * Create a new page with configured headers
   * @returns Configured page instance
   */
  async createPage(): Promise<Page> {
    const browser = this.getBrowser();
    const page = await browser.newPage();

    // Set HTTP headers
    // await page.setExtraHTTPHeaders(HTTP_HEADERS);

    this.logger.log('Created new page');
    return page;
  }

  /**
   * Close a page
   * @param page - Page instance to close
   */
  async closePage(page: Page): Promise<void> {
    try {
      if (!page.isClosed()) {
        await page.close();
        this.logger.log('Page closed successfully');
      }
    } catch (error) {
      this.logger.error('Error closing page:', error);
    }
  }

  /**
   * Take screenshot and save to file system
   * @param page - Page to screenshot
   * @param orderId - Order ID for filename
   * @param prefix - Optional prefix for filename (e.g., 'error', 'success')
   * @returns Path to saved screenshot
   */
  async takeScreenshot(page: Page, orderId: number, prefix = 'error'): Promise<string> {
    try {
      const timestamp = Date.now();
      const filename = `${prefix}-${orderId}-${timestamp}.png`;
      const filepath = path.join(this.screenshotsDir, filename);

      await page.screenshot({
        path: filepath as `${string}.png`,
        fullPage: true,
      });

      this.logger.log(`Screenshot saved: ${filepath}`);
      return filepath;
    } catch (error) {
      this.logger.error('Failed to take screenshot:', error);
      throw error;
    }
  }

  /**
   * Shutdown browser gracefully
   * Called during application shutdown
   */
  async shutdown(): Promise<void> {
    if (this.browser) {
      try {
        this.logger.log('Shutting down Puppeteer browser...');
        await this.browser.close();
        this.browser = null;
        this.logger.log('Puppeteer browser shut down successfully');
      } catch (error) {
        this.logger.error('Error shutting down browser:', error);
      }
    }
  }

  /**
   * OnModuleDestroy lifecycle hook
   */
  async onModuleDestroy(): Promise<void> {
    await this.shutdown();
  }

  async getCookies() {
    return await this.browser.cookies()
  }
}
