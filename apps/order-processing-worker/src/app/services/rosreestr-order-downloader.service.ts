import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { Cookie } from 'puppeteer';
import { AxiosInstance } from 'axios';
import { appConfig } from '@rosreestr-extracts/config';
import { createAxiosInstance } from '../common/axios.factory';
import * as fs from 'fs';
import * as path from 'path';
import { ApplicationResponse } from '../interfaces/place-order-result.interface';
import { cookiesToString } from '../common/puppeteer.utils';

/**
 * Result of order status check
 */
export interface OrderStatusCheckResult {
  isReady: boolean;
  status: string;
  requestStatus: string;
  applicationId?: number;
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
   * @param orderNum - Rosreestr order number (requestNumber)
   * @param cookies - Browser cookies for authentication
   * @returns Order status check result
   */
  async checkOrderStatus(orderNum: string, cookies: Cookie[]): Promise<OrderStatusCheckResult> {
    const cookieString = cookiesToString(cookies);
    this.logger.log(`Checking status for order: ${orderNum}`);

    const response = await this.axiosInstance.post<ApplicationResponse>(
      'https://lk.rosreestr.ru/account-back/applications?page=0&size=10',
      {
        requestNumber: orderNum,
        cadastralNumber: '',
        startDate: null,
        endDate: null,
      },
      {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          Connection: 'keep-alive',
          'Content-Type': 'application/json;charset=UTF-8',
          Cookie: cookieString,
          Origin: 'https://lk.rosreestr.ru',
          Referer: 'https://lk.rosreestr.ru/request-access-egrn/my-claims',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        },
      }
    );

    this.logger.log(`Status check response for ${orderNum}:`, JSON.stringify(response.data));

    const responseData = response.data;

    if (!responseData.content || responseData.content.length === 0) {
      throw new Error(`Order ${orderNum} not found`);
    }

    const application = responseData.content[0];
    const isReady = application.requestStatus === 'Выполнено';

    return {
      isReady,
      status: application.statusCode,
      requestStatus: application.requestStatus,
      applicationId: application.id,
    };
  }

  /**
   * Download order file and save to orderDownloadsDir as Response-{orderNum}.zip
   * @param orderNum - Rosreestr order number (requestNumber)
   * @param applicationId - Internal order ID (not used in new implementation)
   * @param cookies - Browser cookies for authentication
   * @returns Path to downloaded file
   */
  async downloadOrderFiles(orderNum: string, applicationId: number, cookies: Cookie[]): Promise<string> {
    const cookieString = cookiesToString(cookies);

    try {
      this.logger.log(`Downloading file for order: ${orderNum}`);

      // Create download directory
      const orderDownloadsDir = this.appCfg.worker.orderDownloadsDir;
      if (!fs.existsSync(orderDownloadsDir)) {
        fs.mkdirSync(orderDownloadsDir, { recursive: true });
        this.logger.log(`Created directory: ${orderDownloadsDir}`);
      }

      // Download the file
      const downloadUrl = `https://lk.rosreestr.ru/account-back/applications/${applicationId}/download`;
      const fileName = `Response-${orderNum}.zip`;
      const filePath = path.join(orderDownloadsDir, fileName);

      this.logger.log(`Downloading file from: ${downloadUrl}`);

      const response = await this.axiosInstance.get(downloadUrl, {
        headers: {
          Accept: 'application/zip,*/*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          Connection: 'keep-alive',
          Cookie: cookieString,
          Referer: 'https://lk.rosreestr.ru/request-access-egrn/my-claims',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
        },
        responseType: 'arraybuffer',
      });

      fs.writeFileSync(filePath, Buffer.from(response.data as ArrayBuffer));
      this.logger.log(`File saved: ${filePath}`);

      return filePath;
    } catch (error) {
      this.logger.error(`Error downloading file for order ${orderNum}:`, error);
      throw error;
    }
  }
}
