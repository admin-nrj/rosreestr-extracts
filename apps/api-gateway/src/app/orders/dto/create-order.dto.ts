import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, MaxLength, Matches } from 'class-validator';

/**
 * DTO for creating a single order
 */
export class CreateOrderDto {
  @ApiProperty({
    description: 'Cadastral number in format XX:XX:XXXXXX(X):X(XXXXXXXX)',
    example: '77:01:0001001:1234',
    pattern: '^([0-9]{2})[:]([0-9]{2})[:]([0-9]{6,7})[:]([0-9]{1,8})$',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  @Matches(/^([0-9]{2}):([0-9]{2}):([0-9]{6,7}):([0-9]{1,8})$/, {
    message: 'Cadastral number must be in format XX:XX:XXXXXX(X):X(XXXXXXXX), e.g., 77:01:0001001:1234',
  })
  cadNum: string;

  @ApiProperty({
    description: 'Name of the recipient',
    example: 'Иванов Иван Иванович',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  recipientName: string;

  @ApiPropertyOptional({
    description: 'Rosreestr order number',
    example: 'RR-2024-123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rosreestrOrderNum?: string;

  @ApiPropertyOptional({
    description: 'Order status',
    example: 'pending',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string;

  @ApiPropertyOptional({
    description: 'Whether the order is complete',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  @ApiPropertyOptional({
    description: 'Additional comment',
    example: 'Urgent order',
  })
  @IsOptional()
  @IsString()
  comment?: string;

  @ApiPropertyOptional({
    description: 'Date when registration started at Rosreestr',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  rosreestrRegistrationStartedAt?: string;

  @ApiPropertyOptional({
    description: 'Date when registered at Rosreestr',
    example: '2024-01-20T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  rosreestrRegisteredAt?: string;

  @ApiPropertyOptional({
    description: 'Date when order was completed',
    example: '2024-01-25T16:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  completedAt?: string;
}
