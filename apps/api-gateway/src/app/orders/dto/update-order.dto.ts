import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';

/**
 * DTO for updating an order
 */
export class UpdateOrderDto {
  @ApiPropertyOptional({
    description: 'Rosreestr order number',
    example: 'RR-2024-123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  rosreestrOrderNum?: string;

  @ApiPropertyOptional({
    description: 'Name of the recipient',
    example: 'Иванов Иван Иванович',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  recipientName?: string;

  @ApiPropertyOptional({
    description: 'Order status',
    example: 'in_progress',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  status?: string;

  @ApiPropertyOptional({
    description: 'Whether the order is complete',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isComplete?: boolean;

  @ApiPropertyOptional({
    description: 'Additional comment',
    example: 'Updated information',
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
