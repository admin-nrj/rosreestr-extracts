import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ValidateNested, ArrayMinSize, IsArray } from 'class-validator';
import { CreateOrderDto } from './create-order.dto';

/**
 * DTO for creating multiple orders
 */
export class CreateOrdersDto {
  @ApiProperty({
    description: 'Array of orders to create',
    type: [CreateOrderDto],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one order is required' })
  @ValidateNested({ each: true })
  @Type(() => CreateOrderDto)
  orders: CreateOrderDto[];
}
