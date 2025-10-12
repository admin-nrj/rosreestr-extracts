import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class UserDto {
  @ApiProperty({ example: 1 })
  userId: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'John Doe' })
  name: string;

  @ApiProperty({ example: 'user' })
  role: string;

  @ApiProperty({ example: true })
  isActive: boolean;

  @ApiProperty({ example: '2025-01-15T10:30:00Z' })
  lastLoginAt: string;

  @ApiProperty({ example: false })
  emailVerified: boolean;

  @ApiProperty({ example: 0 })
  payCount: number;

  @ApiPropertyOptional({ example: 1001 })
  pbxExtension?: number;
}
