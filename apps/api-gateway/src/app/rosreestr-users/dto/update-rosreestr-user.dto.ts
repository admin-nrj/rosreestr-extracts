import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateRosreestrUserDto {
  @IsString()
  @IsOptional()
  username?: string;

  @IsString()
  @IsOptional()
  @MinLength(6)
  password?: string;

  @IsString()
  @IsOptional()
  guLogin?: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
