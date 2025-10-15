import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, IsDateString, MaxLength } from 'class-validator';
import { IsNotEmptyObject } from '../../common/validators';
import { Type } from 'class-transformer';

/**
 * DTO for updating an order
 * At least one field must be provided for update
 */
export class UpdateOrderDto {
  // Hidden property used to validate that at least one field is provided
  @IsNotEmptyObject()
  private readonly _validateNotEmpty?: any;
  @ApiPropertyOptional({
    description: 'Rosreestr order number',
    example: 'RR-2024-123456',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Type(() => String)
  rosreestrOrderNum?: string;

  @ApiPropertyOptional({
    description: 'Name of the recipient',
    example: 'Иванов Иван Иванович',
  })
  @IsOptional()
  @IsString()
  @MaxLength(255)
  @Type(() => String)
  recipientName?: string;

  @ApiPropertyOptional({
    description: 'Order status',
    example: 'В обработке',
  })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  @Type(() => String)
  status?: string;

  @ApiPropertyOptional({
    description: 'Whether the order is complete',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  isComplete?: boolean;

  @ApiPropertyOptional({
    description: 'Additional comment',
    example: 'Updated information',
  })
  @IsOptional()
  @IsString()
  @Type(() => String)
  comment?: string;

  @ApiPropertyOptional({
    description: 'Date when registration started at Rosreestr',
    example: '2024-01-15T10:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  rosreestrRegistrationStartedAt?: string;

  @ApiPropertyOptional({
    description: 'Date when registered at Rosreestr',
    example: '2024-01-20T14:30:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  rosreestrRegisteredAt?: string;

  @ApiPropertyOptional({
    description: 'Date when order was completed',
    example: '2024-01-25T16:00:00Z',
  })
  @IsOptional()
  @IsDateString()
  @Type(() => String)
  completedAt?: string;
}
