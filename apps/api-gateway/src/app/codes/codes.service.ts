import { Injectable, Logger } from '@nestjs/common';
import { RedisPubSubService, CodeType } from '@rosreestr-extracts/redis-pubsub';

/**
 * Service for handling code delivery to workers via Redis Pub/Sub
 */
@Injectable()
export class CodesService {
  private readonly logger = new Logger(CodesService.name);

  constructor(private readonly redisPubSubService: RedisPubSubService) {}

  /**
   * Deliver SMS code to worker via Redis Pub/Sub
   * @param rosreestrUserName - Username waiting for the code
   * @param smsText - SMS text with verification code
   * @returns Number of subscribers who received the message
   */
  async deliverSmsCode(rosreestrUserName: string, smsText: string): Promise<number> {
    this.logger.log(`Delivering SMS code for user: ${rosreestrUserName}`);
    this.logger.log(`Delivering SMS code, sms text: ${smsText}`);

    const regex = new RegExp(/\d+/)
    const [code] = regex.exec(smsText) || []

    this.logger.log(`[deliverSmsCode] code: ${code}`);

    return this.redisPubSubService.publishCode({
      rosreestrUserName,
      type: CodeType.SMS,
      code,
    });
  }

  /**
   * Deliver Captcha code to worker via Redis Pub/Sub
   * @param rosreestrUserName - Username waiting for the code
   * @param code - Captcha verification code
   * @returns Number of subscribers who received the message
   */
  async deliverCaptchaCode(rosreestrUserName: string, code: string): Promise<number> {
    this.logger.log(`Delivering Captcha code for user: ${rosreestrUserName}`);

    return this.redisPubSubService.publishCode({
      rosreestrUserName,
      type: CodeType.CAPTCHA,
      code,
    });
  }
}
