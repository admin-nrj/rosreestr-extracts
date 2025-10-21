import { Injectable, Logger } from '@nestjs/common';
import { Cookie } from 'puppeteer';
import { AxiosInstance } from 'axios';
import { CadastralSearchResponse, PlaceOrderResult, UploadResponse } from '../interfaces/place-order-result.interface';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { createAxiosInstance } from '../common/axios.factory';
import { randomPause } from '@rosreestr-extracts/utils';

@Injectable()
export class RosreestrOrderService {
  private readonly logger = new Logger(RosreestrOrderService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = createAxiosInstance();
  }

  /**
   * Place order on Rosreestr portal using sequential API requests
   */
  async placeOrderByFetch(cadNum: string, browserCookies: Cookie[]): Promise<PlaceOrderResult> {
    // Get cookies from authenticated Puppeteer session
    const cookieString = browserCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

    try {
      // Step 1: Search for cadastral number
      this.logger.log(`Step 1: Searching for cadastral number: ${cadNum}`);
      const searchResponse = await this.searchCadastralNumber(cadNum, cookieString);

      // Check if cadastral number exists
      if (!searchResponse.count || searchResponse.elements.length === 0) {
        this.logger.warn(`Cadastral number ${cadNum} not found on portal`);
        return { status: OrderStatus.CAD_NUM_NOT_FOUND_ON_PORTAL, isComplete: true };
      }

      const objectData = searchResponse.elements[0];
      this.logger.log(`Found object: ${objectData.cadastralNumber} - ${objectData.address}`);
      await randomPause();

      // Step 2: Get current user access key
      this.logger.log('Step 2: Getting current user access key');
      const accessKey = await this.getCurrentUserAccessKey(cookieString);
      this.logger.log(`Access key retrieved: ${accessKey}`);
      await randomPause();

      // Step 3: Upload statement data
      this.logger.log('Step 3: Uploading statement data');
      const uploadResponse = await this.uploadStatement(cadNum, objectData, accessKey, cookieString);
      this.logger.log(`Upload response: ${JSON.stringify(uploadResponse)}`);
      await randomPause();

      // Step 4: Finish request and get order number
      this.logger.log('Step 4: Finishing request');
      const orderNum = await this.finishRequest(uploadResponse, accessKey, browserCookies);
      this.logger.log(`Order placed successfully: ${orderNum}`);

      return { orderNum, status: OrderStatus.REGISTERED };
    } catch (error) {
      this.logger.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Step 1: Search for cadastral number
   */
  private async searchCadastralNumber(cadNum: string, cookieString: string): Promise<CadastralSearchResponse> {
    const response = await this.axiosInstance.post<CadastralSearchResponse>(
      'https://lk.rosreestr.ru/account-back/on/with-addresses',
      {
        filterType: 'cadastral',
        cadNumbers: [cadNum],
      },
      {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          Connection: 'keep-alive',
          'Content-Type': 'application/json;charset=UTF-8',
          Cookie: cookieString,
          Origin: 'https://lk.rosreestr.ru',
          Pragma: 'no-cache',
          Referer: 'https://lk.rosreestr.ru/request-access-egrn/property-search',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
        },
      }
    );

    return response.data;
  }

  /**
   * Step 2: Get current user access key
   */
  private async getCurrentUserAccessKey(cookieString: string): Promise<string> {
    const response = await this.axiosInstance.get<string>(
      'https://lk.rosreestr.ru/account-back/access-key/current-user',
      {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          Connection: 'keep-alive',
          Cookie: cookieString,
          Pragma: 'no-cache',
          Referer: 'https://lk.rosreestr.ru/request-access-egrn/property-search',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
        },
      }
    );

    return response.data;
  }

  /**
   * Step 3: Upload statement data
   */
  private async uploadStatement(
    cadNum: string,
    objectData: CadastralSearchResponse['elements'][0],
    accessKey: string,
    cookieString: string
  ): Promise<UploadResponse> {
    // Extract area from mainCharacters
    const areaCharacter = objectData.mainCharacters?.find((char) => char.code === '05');
    const area = areaCharacter?.value?.toString() || '0';

    // Generate UUIDs for the request (these should be unique for each request)
    const superPackageGuid = this.generateUUID();
    const statementGuid = this.generateUUID();
    const packageGuid = this.generateUUID();
    const draftGuid = this.generateUUID();

    const payload = {
      title: 'Предоставление сведений об объектах недвижимости и (или) их правообладателях',
      superPackageGuid,
      statementGuid,
      packageGuid,
      draftGuid,
      sign: false,
      dataType: {
        code: 'object',
      },
      purpose: {
        formType: 'EGRNRequest',
        actionCode: '659511111113',
        statementType: '558630300000',
        cadastralAction: '',
        accessKey,
        resourceType: 'fgisEgrn',
      },
      agreement: {
        dataProcessingAgreement: true,
      },
      declarantKind: {
        code: 'declarant',
      },
      declarantType: {
        code: 'person',
      },
      deliveryAction: {
        delivery: '785003000000',
        linkEmail: 'fedotovsvit@gmail.com',
      },
      declarants: [
        {
          firstname: 'Светлана',
          surname: 'Федотова',
          patronymic: 'Сергеевна',
          countryInformation: 'RUS',
          snils: '116-001-837 00',
          email: 'fedotovsvit@gmail.com',
          phoneNumber: '+7(903)4317091',
          addresses: [],
        },
      ],
      representative: [],
      attachments: [
        {
          documentTypeCode: '008001001000',
          documentParentCode: '008001000000',
          series: '6010',
          number: '825809',
          issueDate: '08.09.2010',
          issuer: 'Межрайонным отделом УФМС России по Ростовской области в городе Сальске',
          subjectType: 'declarant',
        },
      ],
      objects: [
        {
          objectTypeCode: objectData.objectType,
          cadastralNumber: cadNum,
          physicalProperties: [
            {
              property: 'area',
              propertyValue: area,
              unittypearea: '012002001000',
            },
          ],
        },
      ],
      uptodate: {
        uptodateData: true,
      },
      specialDeclarantKind: {
        code: '357039000000',
      },
      extractDataRequestType1: '101',
      actionType: 'info',
    };

    const response = await this.axiosInstance.post<UploadResponse>(
      'https://lk.rosreestr.ru/account-request/statement/upload',
      payload,
      {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          Connection: 'keep-alive',
          'Content-Type': 'application/json;charset=UTF-8',
          Cookie: cookieString,
          Origin: 'https://lk.rosreestr.ru',
          Pragma: 'no-cache',
          Referer: 'https://lk.rosreestr.ru/request-access-egrn/property-search',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
        },
      }
    );

    return response.data;
  }

  /**
   * Step 4: Finish request and get order number
   */
  private async finishRequest(
    uploadResponse: UploadResponse,
    accessKey: string,
    browserCookies: Cookie[]
  ): Promise<string> {
    // Extract esiaUserId from PC_USER_WAS_AUTHORIZED cookie
    const esiaUserId = this.extractCookieValue(browserCookies, 'PC_USER_WAS_AUTHORIZED');

    if (!esiaUserId) {
      throw new Error('PC_USER_WAS_AUTHORIZED cookie not found');
    }

    const cookieString = browserCookies.map((cookie) => `${cookie.name}=${cookie.value}`).join('; ');

    const payload = {
      superPackageGuid: uploadResponse.superPackageGuid,
      esiaUserId,
      subjectObject: '',
      packageType: 'egrn_with_docs_1',
      accessKey,
    };

    const response = await this.axiosInstance.post<string>(
      'https://lk.rosreestr.ru/account-request/statement/finish',
      payload,
      {
        headers: {
          Accept: 'application/json, text/plain, */*',
          'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
          Connection: 'keep-alive',
          'Content-Type': 'application/json;charset=UTF-8',
          Cookie: cookieString,
          Origin: 'https://lk.rosreestr.ru',
          Pragma: 'no-cache',
          Referer: 'https://lk.rosreestr.ru/request-access-egrn/property-search',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent':
            'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36',
          'sec-ch-ua': '"Google Chrome";v="141", "Not?A_Brand";v="8", "Chromium";v="141"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"Linux"',
        },
      }
    );

    return response.data;
  }

  /**
   * Generate random UUID v4
   */
  private generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      const v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  /**
   * Extract cookie value from browser cookies array
   * @param browserCookies - Array of cookies from Puppeteer
   * @param cookieName - Name of the cookie to extract
   * @returns Cookie value or undefined if not found
   */
  private extractCookieValue(browserCookies: Cookie[], cookieName: string): string | undefined {
    const targetCookie = browserCookies.find((cookie) => cookie.name === cookieName);
    return targetCookie?.value;
  }
}
