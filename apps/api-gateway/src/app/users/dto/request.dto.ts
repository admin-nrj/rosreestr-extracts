import {
  IsBoolean,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class UpdateUserDto {
  @ApiPropertyOptional({ example: 'user@example.com' })
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  @Type(() => String)
  email?: string

  @ApiPropertyOptional({ example: 'John Doe', maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(255, { message: 'Name is too long' })
  @Type(() => String)
  name?: string

  @ApiPropertyOptional({ example: 'admin', maxLength: 255 })
  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(255, { message: 'Name is too long' })
  @Type(() => String)
  role?: string

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  @Type(() => Boolean)
  isActive?: boolean

  @ApiPropertyOptional({ example: 5, minimum: 0 })
  @IsOptional()
  @IsInt({ message: 'payCount must be a number' })
  @Min(0, { message: 'payCount should be equal or greater than 0' })
  @Type(() => Number)
  payCount?: number

  @ApiPropertyOptional({ example: 1001, minimum: 100, maximum: 9999 })
  @IsOptional()
  @IsInt({ message: 'payCount must be a number' })
  @Min(100, { message: 'payCount should be equal or greater than 100' })
  @Max(9999, { message: 'payCount should be equal or less than 9999' })
  @Type(() => Number)
  pbxExtension?: number
}
