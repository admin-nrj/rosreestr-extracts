import { IsString, IsNotEmpty, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for SMS code delivery query parameters
 */
export class SmsCodeDeliveryDto {
  @ApiProperty({
    description: 'Rosreestr username',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  userName: string;

  @ApiProperty({
    description: 'SMS verification code (4-30 characters)',
    example: '123456',
    minLength: 4,
    maxLength: 30,
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 30)
  @Type(() => String)
  code: string;
}

/**
 * DTO for Captcha code delivery query parameters
 */
export class CaptchaCodeDeliveryDto {
  @ApiProperty({
    description: 'Rosreestr username',
    example: 'user@example.com',
  })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  userName: string;

  @ApiProperty({
    description: 'Captcha verification code (3-20 characters)',
    example: 'abc123',
    minLength: 3,
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @Length(3, 20)
  @Type(() => String)
  code: string;
}

/**
 * Response DTO for code delivery
 */
export class CodeDeliveryResponseDto {
  @ApiProperty({
    description: 'Whether the code was delivered successfully',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Number of subscribers who received the code',
    example: 1,
  })
  subscribers: number;
}
