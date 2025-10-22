import { Injectable, Logger } from '@nestjs/common';
import { Cookie } from 'puppeteer';
import { AxiosInstance } from 'axios';
import {
  BalanceResponse,
  CadastralSearchResponse,
  ProfileInfo,
  PlaceOrderResult,
  ProfileInfoResponse,
  UploadResponse
} from '../interfaces/place-order-result.interface';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { createAxiosInstance } from '../common/axios.factory';
import { randomPause } from '@rosreestr-extracts/utils';
import { cookiesToString } from '../common/puppeteer.utils';

@Injectable()
export class RosreestrOrderService {
  private readonly logger = new Logger(RosreestrOrderService.name);
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.axiosInstance = createAxiosInstance();
  }

  /**
   * Fetch user profile information from Rosreestr portal
   * @param oid - User ID from PC_USER_WAS_AUTHORIZED cookie
   * @param cookieString - Cookie string for authentication
   * @returns Profile information
   */
  private async fetchProfileInfo(oid: string, cookieString: string): Promise<ProfileInfoResponse> {
    try {
      const response = await this.axiosInstance.get<ProfileInfoResponse>(
        `https://lk.rosreestr.ru/account-back/profile/info?oid=${oid}`,
        {
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            Connection: 'keep-alive',
            Cookie: cookieString,
            Pragma: 'no-cache',
            Referer: 'https://lk.rosreestr.ru/login?redirect=/',
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
    } catch (error) {
      this.logger.error('Error fetching profile info:', error);
      throw error;
    }
  }

  /**
   * Transform profile info to order user data format
   * @param profileInfo - Profile information from API
   * @returns Transformed order user data
   */
  private transformProfileToOrderData(profileInfo: ProfileInfoResponse): ProfileInfo {
    const { attributesOauth } = profileInfo;

    // Find RF_PASSPORT document (passport)
    const passport = attributesOauth.documents?.elements.find((doc) => doc.type === 'RF_PASSPORT');

    // If no passport found, throw error
    if (!passport) {
      throw new Error('RF_PASSPORT document not found in profile');
    }

    // Get email and phone from contacts or top-level fields
    const email = attributesOauth.email || profileInfo.email || '';
    const phone = attributesOauth.phone || profileInfo.phone || '';

    return {
      deliveryAction: {
        delivery: '785003000000',
        linkEmail: email,
      },
      declarants: [
        {
          firstname: attributesOauth.firstName,
          surname: attributesOauth.lastName,
          patronymic: attributesOauth.middleName,
          countryInformation: attributesOauth.citizenship || 'RUS',
          snils: attributesOauth.snils || profileInfo.snils || '',
          email: email,
          phoneNumber: phone,
          addresses: [],
        },
      ],
      attachments: [
        {
          documentTypeCode: '008001001000',
          documentParentCode: '008001000000',
          series: passport.series,
          number: passport.number,
          issueDate: passport.issueDate,
          issuer: passport.issuedBy,
          subjectType: 'declarant',
        },
      ],
    };
  }

  async fetchUserProfileInfo(browserCookies: Cookie[]) {
    this.logger.log('Step 0.5: Fetching user profile info');
    const cookieString = cookiesToString(browserCookies);
    const esiaUserId = this.extractCookieValue(browserCookies, 'PC_USER_WAS_AUTHORIZED');
    if (!esiaUserId) {
      throw new Error('PC_USER_WAS_AUTHORIZED cookie not found');
    }

    const profileInfoResponse = await this.fetchProfileInfo(esiaUserId, cookieString);
    const profileInfo = this.transformProfileToOrderData(profileInfoResponse);
    const declarant = profileInfo.declarants[0];
    this.logger.log(`Profile info fetched for user: ${declarant.firstname} ${declarant.surname}`);

    return profileInfo;
  }

  /**
   * Place order on Rosreestr portal using sequential API requests
   */
  async placeOrderByFetch(
    cadNum: string,
    browserCookies: Cookie[],
    profileInfo: ProfileInfo
  ): Promise<PlaceOrderResult> {
    // Get cookies from authenticated Puppeteer session
    const cookieString = cookiesToString(browserCookies);

    try {
      // Step 0: Check available balance
      this.logger.log('Step 0: Checking available balance');
      const availableOrders = await this.checkBalance(cookieString);

      if (availableOrders === null) {
        this.logger.warn('Failed to check balance, continuing with order placement');
      } else if (availableOrders <= 0) {
        this.logger.warn(`Insufficient balance: ${availableOrders} orders available`);
        return { status: OrderStatus.INSUFFICIENT_BALANCE };
      } else {
        this.logger.log(`Balance check passed: ${availableOrders} orders available`);
      }
      await randomPause();

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
      const uploadResponse = await this.uploadStatement(cadNum, objectData, accessKey, profileInfo, cookieString);
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
   * Check available balance for orders
   * @returns Number of available orders or null if check failed
   */
  private async checkBalance(cookieString: string): Promise<number | null> {
    try {
      const response = await this.axiosInstance.get<BalanceResponse>(
        'https://lk.rosreestr.ru/account-back/finances/operations/total?tab=egrn_subscription',
        {
          headers: {
            Accept: 'application/json, text/plain, */*',
            'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
            Connection: 'keep-alive',
            Cookie: cookieString,
            Pragma: 'no-cache',
            Referer: 'https://lk.rosreestr.ru/finances',
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

      // Find the balance item with mnemo "egrn_with_docs_1"
      const balanceItem = response.data.find((item) => item.mnemo === 'egrn_with_docs_1');

      if (balanceItem) {
        return balanceItem.count;
      }

      this.logger.warn('Balance item with mnemo "egrn_with_docs_1" not found');
      return null;
    } catch (error) {
      this.logger.error('Error checking balance:', error);
      return null;
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
    profileInfo: ProfileInfo,
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
      deliveryAction: profileInfo.deliveryAction,
      declarants: profileInfo.declarants,
      representative: [],
      attachments: profileInfo.attachments,
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

    const cookieString = cookiesToString(browserCookies);

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
