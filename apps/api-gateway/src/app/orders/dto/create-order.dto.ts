import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';

/**
 * DTO for creating a single order
 */
export class CreateOrderDto {
  @ApiProperty({
    description: 'Cadastral number',
    example: '77:01:0001001:1234',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
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
