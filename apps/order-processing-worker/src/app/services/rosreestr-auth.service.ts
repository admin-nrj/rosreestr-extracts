import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { ClientGrpc } from '@nestjs/microservices';
import { Page } from 'puppeteer';
import { ROSREESTR_SELECTORS, ROSREESTR_URLS, GU_SELECTORS } from '@rosreestr-extracts/constants';
import { appConfig } from '@rosreestr-extracts/config';
import { PUPPETEER_TIMEOUTS } from '../common/puppeteer-options.constants';
import { elementExists, waitForTimeOut, downloadFile, deleteFile } from '../common/puppeteer.utils';
import {
  ANOMALY_QUESTIONS_PACKAGE_NAME,
  AnomalyQuestionsServiceClient,
  ANOMALY_QUESTIONS_SERVICE_NAME,
} from '@rosreestr-extracts/interfaces';
import { RedisSubscriberService, CodeType } from '@rosreestr-extracts/redis-pubsub';
import { lastValueFrom } from 'rxjs';
import { getErrorMessage } from '@rosreestr-extracts/utils';

/**
 * Credentials for Rosreestr/Gosuslugi authentication
 */
export interface RosreestrCredentials {
  username: string;
  guLogin: string;
  password: string;
}

/**
 * Service for handling authentication on Rosreestr portal via Gosuslugi
 */
@Injectable()
export class RosreestrAuthService implements OnModuleInit {
  private readonly logger = new Logger(RosreestrAuthService.name);
  private anomalyQuestionsService: AnomalyQuestionsServiceClient;

  constructor(
    @Inject(appConfig.KEY)
    private readonly config: ConfigType<typeof appConfig>,
    @Inject(ANOMALY_QUESTIONS_PACKAGE_NAME)
    private readonly anomalyQuestionsClient: ClientGrpc,
    private readonly redisSubscriberService: RedisSubscriberService
  ) {}

  onModuleInit() {
    this.anomalyQuestionsService =
      this.anomalyQuestionsClient.getService<AnomalyQuestionsServiceClient>(ANOMALY_QUESTIONS_SERVICE_NAME);
  }

  /**
   * Check if user is authenticated on Rosreestr portal
   * @param page - Puppeteer page instance
   * @returns true if authenticated, false otherwise
   */
  async checkAuthStatus(page: Page): Promise<boolean> {
    try {
      this.logger.log('Checking authentication status...');

      // Navigate to property search page
      await page.goto(ROSREESTR_URLS.PROPERTY_SEARCH, {
        waitUntil: 'networkidle2',
        timeout: PUPPETEER_TIMEOUTS.NAVIGATION,
      });

      // Wait a bit for page to fully load
      await waitForTimeOut(2000);

      // Check for sign-in elements
      const lkSignInExists = await elementExists(page, ROSREESTR_SELECTORS.LK_SIGN_IN);
      const guSignInExists = await elementExists(page, GU_SELECTORS.SIGN_IN_BUTTON);

      const isNotAuthenticated = lkSignInExists || guSignInExists;

      if (isNotAuthenticated) {
        this.logger.log('User is NOT authenticated (sign-in elements found)');
        return false;
      }

      this.logger.log('User is authenticated');
      return true;
    } catch (error) {
      this.logger.error('Error checking auth status:', error);
      throw error;
    }
  }

  /**
   * Perform login via Gosuslugi
   * @param page - Puppeteer page instance
   * @param credentials - Login credentials
   */
  async login(page: Page, credentials: RosreestrCredentials): Promise<void> {
    try {
      this.logger.log(`Performing login for user: ${credentials.username}`);

      // Check if we're on the login page
      const guSignInExists = await elementExists(page, GU_SELECTORS.SIGN_IN_BUTTON);

      if (!guSignInExists) {
        // Try to click the sign-in button on Rosreestr page
        const lkSignInExists = await elementExists(page, ROSREESTR_SELECTORS.LK_SIGN_IN);
        if (lkSignInExists) {
          this.logger.log('Clicking Rosreestr sign-in button...');
          // Navigate to GU login page
          // await page.goto(GU_URLS.LOGIN_PAGE, { waitUntil: 'networkidle2', timeout: PUPPETEER_TIMEOUTS.NAVIGATION });
          await page.click(ROSREESTR_SELECTORS.LK_SIGN_IN);
          await waitForTimeOut(2000)
        }
      }

      // Wait for Gosuslugi login form
      await page.waitForSelector(GU_SELECTORS.LOGIN_INPUT, {
        timeout: PUPPETEER_TIMEOUTS.NAVIGATION,
      });

      this.logger.log('Entering credentials...');
      await page.focus(GU_SELECTORS.LOGIN_INPUT);
      await page.type(GU_SELECTORS.LOGIN_INPUT, credentials.guLogin, { delay: 100 });
      await page.focus(GU_SELECTORS.PASSWORD_INPUT);
      await page.type(GU_SELECTORS.PASSWORD_INPUT, credentials.password, { delay: 100 });

      await this.handleAndProcessSMSConfirmation(page, credentials.username);
      await this.checkAndProcessCaptcha(page, credentials.username);
      await this.checkAndProcessAnomalyQuestion(page, credentials.username);
      await this.processMessengerMaxPage(page);
      await waitForTimeOut(1000);
      this.logger.log('Login submitted, waiting for completion...');

      // Wait for login to complete and redirect back to Rosreestr
      await this.waitForLoginComplete(page);

      this.logger.log('Login completed successfully');
    } catch (error) {
      this.logger.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Wait for login process to complete
   * @param page - Puppeteer page instance
   */
  async waitForLoginComplete(page: Page): Promise<void> {
    try {
      // Wait for URL to change back to Rosreestr domain
      await page.waitForFunction(
        (url) => window.location.href.includes(url),
        { timeout: PUPPETEER_TIMEOUTS.LOGIN_COMPLETE },
        'rosreestr.ru'
      );

      // Additional wait to ensure page is fully loaded
      await new Promise((resolve) => setTimeout(resolve, 3000));

      this.logger.log('Login redirect completed');
    } catch (error) {
      this.logger.error('Timeout waiting for login to complete:', error);
      throw error;
    }
  }

  private async getGUSubmitButtonSelector(page: Page): Promise<string> {
    const signInButtonElement = await page.$(GU_SELECTORS.SIGN_IN_BUTTON);
    const signInButtonText = await page.evaluate((el) => el?.textContent, signInButtonElement);
    this.logger.log('[getGUSubmitButtonSelector] signInButtonText ' + signInButtonText);
    if (signInButtonText && signInButtonText.toLowerCase().trim() === 'Восстановить'.toLowerCase()) {
      return GU_SELECTORS.SIGN_IN_BUTTON2;
    } else {
      return GU_SELECTORS.SIGN_IN_BUTTON;
    }
  }

  private async checkAndProcessCaptcha(page: Page, rosreestrUserName: string) {
    this.logger.log('[checkAndProcessCaptcha] start captcha checking');

    await waitForTimeOut(500);

    const captchaImageLabelElement = await page.$(GU_SELECTORS.CAPTCHA_IMAGE_LABEL);
    const captchaImageLabelText = await page.evaluate((el) => el?.textContent, captchaImageLabelElement);
    this.logger.log('[checkAndProcessCaptcha] captchaImageLabelText', captchaImageLabelText);
    if (
      !captchaImageLabelElement ||
      !captchaImageLabelText ||
      captchaImageLabelText.toLowerCase().trim() !== 'Введите код с картинки'.toLowerCase()
    )
      return;

    const captchaImageElement = await page.$(GU_SELECTORS.CAPTCHA_IMAGE);
    const captchaImageSrc = await page.evaluate((el) => el?.src, captchaImageElement);
    const captchaFilePath = await downloadFile(captchaImageSrc, page, this.config.worker.puppeteer.captchaDir);
    this.logger.log('[checkAndProcessCaptcha] captchaFilePath: ', captchaFilePath);

    const code = await this.getCaptchaCode(captchaFilePath, rosreestrUserName).finally(() => {
      deleteFile(captchaFilePath).catch(console.error);
    });

    this.logger.log('[checkAndProcessCaptcha] code ' + code);
    await page.focus(GU_SELECTORS.CAPTCHA_INPUT);
    await page.keyboard.type(code.toString(), { delay: 100 });
    await page.click(GU_SELECTORS.CAPTCHA_CONTINUE_BUTTON);
    await waitForTimeOut(500);
  }

  private async checkAndProcessAnomalyQuestion(page: Page, rosreestrUserName: string) {
    this.logger.log('Checking anomaly activity');
    const questionElement = await page.$(GU_SELECTORS.ANOMALY_ACTIVITY_QUESTION);
    const questionElementText = await page.evaluate((el) => el?.textContent, questionElement);
    if (
      !questionElement ||
      !questionElementText ||
      !questionElementText.toLowerCase().trim().includes('Подтвердите, что это вы'.toLowerCase())
    ) {
      this.logger.log(`Anomaly activity questionElement: ${String(questionElement)}`);
      this.logger.log(`Anomaly activity questionElementText: ${questionElementText}`);
      this.logger.log('Anomaly activity not detected');
      return;
    }

    this.logger.warn('Anomaly activity is detected!');
    this.logger.log(`Anomaly activity text: ${questionElementText}`);
    const questionText = questionElementText
      .split('\n')
      .map((q) => q.trim())
      .filter((q) => q)
      .pop();
    this.logger.log(`Anomaly activity questionText: ${questionText}`);

    // Search for answer using gRPC service
    const searchResponse = await lastValueFrom(
      this.anomalyQuestionsService.searchQuestion({
        question: questionText,
        rosreestrUserName,
      })
    );

    if (searchResponse.error) {
      this.logger.error(`Error searching anomaly question: ${searchResponse.error.message}`);
      throw new Error(`Failed to get anomaly question answer: ${searchResponse.error.message}`);
    }

    const anomalyAnswer = searchResponse.anomalyQuestion?.answer;

    if (!anomalyAnswer) {
      this.logger.warn(`No answer found for anomaly question: ${questionText}`);
      this.logger.warn(`Question was ${searchResponse.isNew ? 'created' : 'found'} but has no answer`);
      throw new Error('No answer available for anomaly question');
    }

    this.logger.log(`Anomaly activity answer: ${anomalyAnswer}`);
    await page.focus(GU_SELECTORS.ANOMALY_ACTIVITY_INPUT);
    await page.keyboard.type(anomalyAnswer, { delay: 10 });
    await waitForTimeOut(100);
    await page.click(GU_SELECTORS.ANOMALY_ACTIVITY_NEXT_BUTTON);
    await waitForTimeOut(500);
  }

  private async processMessengerMaxPage(page: Page) {
    this.logger.log('[processMessengerMaxPage]');
    await waitForTimeOut(500);

    const messengerMaxLabelElement = await page.$(GU_SELECTORS.MESSENGER_MAX_WELCOME_TEXT);
    const messengerMaxLabelText = await page.evaluate((el) => el?.textContent, messengerMaxLabelElement);
    this.logger.log('[processMessengerMaxPage] messengerMaxLabelText', messengerMaxLabelText);
    if (
      !messengerMaxLabelElement ||
      !messengerMaxLabelText ||
      messengerMaxLabelText.toLowerCase().trim() !== 'Подтверждайте вход через мессенджер MAX'.toLowerCase()
    )
      return;

    this.logger.log('[logIn] messengerMaxPage click on skip button');

    await page.click(GU_SELECTORS.MESSENGER_MAX_SKIP_BUTTON);
    await waitForTimeOut(500);
  }

  private async handleAndProcessSMSConfirmation(page: Page, rosreestrUserName: string) {
    this.logger.log('[handleAndProcessSMSConfirmation] SMS code processing started');
    let channel: string;

    try {
      // STEP 1: Subscribe to Redis channel BEFORE submitting login form
      // This ensures we don't miss the SMS code
      this.logger.log('[handleAndProcessSMSConfirmation] Subscribing to SMS code channel...');
      channel = await this.redisSubscriberService.subscribeToCodeChannel(rosreestrUserName, CodeType.SMS);
      this.logger.log(`[handleAndProcessSMSConfirmation] Successfully subscribed to channel: ${channel}`);

      // STEP 2: Submit login form
      this.logger.log('Submitting login form...');
      const submitButtonSelector = await this.getGUSubmitButtonSelector(page);
      await page.click(submitButtonSelector);
      await waitForTimeOut(1000);
      await page.waitForSelector(GU_SELECTORS.SMS_CODE_TEXT, { timeout: PUPPETEER_TIMEOUTS.ELEMENT_WAIT });
    } catch (error) {
      this.logger.error('[handleAndProcessSMSConfirmation] Error during SMS processing:', error);

      // IMPORTANT: Cleanup subscription if we subscribed but failed before waitForCode
      this.logger.warn('[handleAndProcessSMSConfirmation] Cleaning up subscription due to error');
      await this.redisSubscriberService.unsubscribeFromCodeChannel(channel);

      throw error;
    }

    // STEP 3: Wait for the SMS code from Redis
    this.logger.log('[handleAndProcessSMSConfirmation] Waiting for SMS code from Redis...');
    const code = await this.getCodeFromSms(rosreestrUserName);
    this.logger.log('[handleAndProcessSMSConfirmation] Received code: ' + code);

    // STEP 4: Enter the code
    await page.focus(GU_SELECTORS.SMS_CODE_INPUT);
    await page.keyboard.type(String(code), { delay: 100 });
    this.logger.log('[handleAndProcessSMSConfirmation] SMS code entered successfully');
  }

  private async getCaptchaCode(captchaFilePath: string, rosreestrUserName: string): Promise<string> {
    this.logger.log('[getCaptchaCode] captchaFilePath: ', captchaFilePath);
    this.logger.log('[getCaptchaCode] started for user: ', rosreestrUserName);

    try {
      const timeoutMs = this.config.worker.codeDelivery.timeoutMs;
      this.logger.log(`[getCaptchaCode] waiting for captcha code (timeout: ${timeoutMs}ms)`);

      // Wait for captcha code via Redis Pub/Sub
      const code = await this.redisSubscriberService.waitForCode(rosreestrUserName, CodeType.CAPTCHA, timeoutMs);

      this.logger.log(`[getCaptchaCode] received code for user: ${rosreestrUserName}`);
      return code;
    } catch (error) {
      this.logger.error(`[getCaptchaCode] failed for user ${rosreestrUserName}:`, error);
      throw new Error(`Failed to receive captcha code: ${getErrorMessage(error)}`);
    }
  }

  private async getCodeFromSms(rosreestrUserName: string): Promise<string> {
    this.logger.log('[getCodeFromSms] started for user: ', rosreestrUserName);

    try {
      const timeoutMs = this.config.worker.codeDelivery.timeoutMs;
      this.logger.log(`[getCodeFromSms] waiting for SMS code (timeout: ${timeoutMs}ms)`);

      // Wait for SMS code via Redis Pub/Sub
      const code = await this.redisSubscriberService.waitForCode(rosreestrUserName, CodeType.SMS, timeoutMs);

      this.logger.log(`[getCodeFromSms] received code for user: ${rosreestrUserName}`);
      return code;
    } catch (error) {
      this.logger.error(`[getCodeFromSms] failed for user ${rosreestrUserName}:`, error);
      throw new Error(`Failed to receive SMS code: ${getErrorMessage(error)}`);
    }
  }
}
