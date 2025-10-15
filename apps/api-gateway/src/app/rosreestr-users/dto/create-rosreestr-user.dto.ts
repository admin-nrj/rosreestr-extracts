import { IsNotEmpty, IsOptional, IsString, MinLength } from 'class-validator';

export class CreateRosreestrUserDto {
  @IsString()
  @IsNotEmpty()
  username: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password: string;

  @IsString()
  @IsNotEmpty()
  guLogin: string;

  @IsString()
  @IsOptional()
  comment?: string;
}
