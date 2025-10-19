import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

export class CreateRosreestrUserDto {
  @ApiProperty({ example: 'SFedotova' })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  username: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  @Type(() => String)
  password: string;

  @ApiProperty({ example: '123-456-789 00' })
  @IsString()
  @IsNotEmpty()
  @Type(() => String)
  guLogin: string;

  @ApiPropertyOptional({ example: 'any text' })
  @IsString()
  @IsOptional()
  @Type(() => String)
  comment?: string;
}
