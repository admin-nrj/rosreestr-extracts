import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cookie } from 'puppeteer';
import { AxiosInstance } from 'axios';
import { appConfig } from '@rosreestr-extracts/config';
import { createAxiosInstance } from '../common/axios.factory';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Result of order status check
 */
export interface OrderStatusCheckResult {
  isReady: boolean;
  status: string;
  files?: { name: string; url: string }[];
}

/**
 * Service for checking order status and downloading files from Rosreestr portal
 */
@Injectable()
export class RosreestrOrderDownloaderService {
  private readonly logger = new Logger(RosreestrOrderDownloaderService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor(
    @Inject(appConfig.KEY)
    private readonly appCfg: ConfigType<typeof appConfig>
  ) {
    this.axiosInstance = createAxiosInstance();
  }

  /**
   * Check order status on Rosreestr portal
   * @param orderNum - Rosreestr order number
   * @param cookies - Browser cookies for authentication
   * @returns Order status check result
   */
  async checkOrderStatus(orderNum: string, cookies: Cookie[]): Promise<OrderStatusCheckResult> {
    const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

    try {
      this.logger.log(`Checking status for order: ${orderNum}`);

      // TODO: Implement actual Rosreestr API call to check order status
      // This is a placeholder implementation
      const response = await this.axiosInstance.get(
        `https://lk.rosreestr.ru/account-back/requests/${orderNum}`,
        {
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            Connection: 'keep-alive',
            Cookie: cookieString,
            'User-Agent':
              'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          },
        }
      );

      this.logger.log(`Status check response for ${orderNum}:`, response.data);

      // Parse response to determine if order is ready
      // This is placeholder logic - adjust based on actual API response
      const responseData = response.data as { status?: string; ready?: boolean; files?: unknown[] } | null;
      const isReady = responseData?.status === 'COMPLETED' || responseData?.ready === true;
      const files = (responseData?.files || []) as { name?: string; url?: string; downloadUrl?: string }[];

      return {
        isReady,
        status: responseData?.status || 'UNKNOWN',
        files: files.map((file) => ({
          name: file.name || 'document.pdf',
          url: file.url || file.downloadUrl || '',
        })),
      };
    } catch (error) {
      this.logger.error(`Error checking order status for ${orderNum}:`, error);
      throw error;
    }
  }

  /**
   * Download order files and save to DOWNLOADS_DIR/orders/{orderId}/{orderNum}/
   * @param orderNum - Rosreestr order number
   * @param orderId - Internal order ID
   * @param cookies - Browser cookies for authentication
   * @returns Path to directory with downloaded files
   */
  async downloadOrderFiles(orderNum: string, orderId: number, cookies: Cookie[]): Promise<string> {
    const cookieString = cookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

    try {
      this.logger.log(`Downloading files for order: ${orderNum} (ID: ${orderId})`);

      // Create download directory
      const downloadsDir = this.appCfg.worker.puppeteer.downloadsDir;
      if (!fs.existsSync(downloadsDir)) {
        fs.mkdirSync(downloadsDir, { recursive: true });
        this.logger.log(`Created directory: ${downloadsDir}`);
      }

      // First, check order status to get file list
      const statusResult = await this.checkOrderStatus(orderNum, cookies);

      if (!statusResult.isReady || !statusResult.files || statusResult.files.length === 0) {
        throw new Error(`Order ${orderNum} is not ready or has no files`);
      }

      // Download each file
      let downloadedCount = 0;
      for (const file of statusResult.files) {
        const filePath = path.join(downloadsDir, file.name);

        try {
          this.logger.log(`Downloading file: ${file.name} from ${file.url}`);

          const response = await this.axiosInstance.get(file.url, {
            headers: {
              Accept: 'application/pdf,*/*',
              'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
              Connection: 'keep-alive',
              Cookie: cookieString,
              'User-Agent':
                'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
            },
            responseType: 'arraybuffer',
          });

          fs.writeFileSync(filePath, Buffer.from(response.data as ArrayBuffer));
          downloadedCount++;
          this.logger.log(`File saved: ${filePath}`);
        } catch (error) {
          this.logger.error(`Error downloading file ${file.name}:`, error);
          // Continue with other files
        }
      }

      if (downloadedCount === 0) {
        throw new Error(`Failed to download any files for order ${orderNum}`);
      }

      this.logger.log(`Downloaded ${downloadedCount} files to: ${downloadsDir}`);

      return downloadsDir;
    } catch (error) {
      this.logger.error(`Error downloading files for order ${orderNum}:`, error);
      throw error;
    }
  }

}
