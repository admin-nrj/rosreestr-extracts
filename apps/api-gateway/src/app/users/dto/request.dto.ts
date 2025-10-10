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

export class UpdateUserDto {
  @IsEmail({}, { message: 'Invalid email format' })
  @IsNotEmpty({ message: 'Email is required' })
  email?: string

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(255, { message: 'Name is too long' })
  name?: string

  @IsOptional()
  @IsString({ message: 'Name must be a string' })
  @MaxLength(255, { message: 'Name is too long' })
  role?: string

  @IsOptional()
  @IsBoolean({ message: 'isActive must be a boolean' })
  isActive?: boolean

  @IsOptional()
  @IsInt({ message: 'payCount must be a number' })
  @Min(0, { message: 'payCount should be equal or greater than 0' })
  payCount?: number

  @IsOptional()
  @IsInt({ message: 'payCount must be a number' })
  @Min(100, { message: 'payCount should be equal or greater than 100' })
  @Max(9999, { message: 'payCount should be equal or less than 9999' })
  pbxExtension?: number
}
