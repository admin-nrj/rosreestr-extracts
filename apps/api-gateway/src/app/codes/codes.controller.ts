import { Controller, Get, Query, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CodesService } from './codes.service';
import { SmsCodeDeliveryDto, CaptchaCodeDeliveryDto, CodeDeliveryResponseDto } from './dto/code-delivery.dto';

/**
 * Controller for receiving verification codes (SMS, Captcha) and publishing to Redis
 */
@ApiTags('Codes')
@Controller('codes')
export class CodesController {
  private readonly logger = new Logger(CodesController.name);

  constructor(private readonly codesService: CodesService) {}

  /**
   * Receive SMS code and publish to Redis for worker consumption
   * GET /api/codes/sms?userName={rosreestrUserName}&code={smsCode}
   */
  @Get('sms')
  @ApiOperation({ summary: 'Deliver SMS verification code to worker' })
  @ApiResponse({ status: 200, description: 'Code delivered successfully', type: CodeDeliveryResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async receiveSmsCode(@Query() query: SmsCodeDeliveryDto): Promise<CodeDeliveryResponseDto> {
    const { userName, code } = query;

    this.logger.log(`Received SMS code request for userName: ${userName}`);
    this.logger.log(`Received SMS code request for code: ${code}`);

    // Publish code to Redis
    const subscribers = await this.codesService.deliverSmsCode(userName, code);

    this.logger.log(`SMS code delivered for userName: ${userName}, subscribers: ${subscribers}`);

    return {
      success: true,
      subscribers,
    };
  }

  /**
   * Receive Captcha code and publish to Redis for worker consumption
   * GET /api/codes/captcha?userName={rosreestrUserName}&code={captchaCode}
   */
  @Get('captcha')
  @ApiOperation({ summary: 'Deliver Captcha verification code to worker' })
  @ApiResponse({ status: 200, description: 'Code delivered successfully', type: CodeDeliveryResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid parameters' })
  async receiveCaptchaCode(@Query() query: CaptchaCodeDeliveryDto): Promise<CodeDeliveryResponseDto> {
    const { userName, code } = query;

    this.logger.log(`Received Captcha code request for userName: ${userName}`);

    // Publish code to Redis
    const subscribers = await this.codesService.deliverCaptchaCode(userName, code);

    this.logger.log(`Captcha code delivered for userName: ${userName}, subscribers: ${subscribers}`);

    return {
      success: true,
      subscribers,
    };
  }
}
