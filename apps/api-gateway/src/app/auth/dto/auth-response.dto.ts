import { ApiPropertyOptional } from '@nestjs/swagger';
import { UserDto } from '../../common/dto/response.dto';
import { ErrorCode } from '@rosreestr-extracts/interfaces';

export class AuthResponseDto {
  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  accessToken?: string;

  @ApiPropertyOptional({ example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' })
  refreshToken?: string;

  @ApiPropertyOptional({ type: UserDto })
  user?: UserDto;

  @ApiPropertyOptional()
  error?: {
    message?: string | undefined;
    errorCode?: ErrorCode | undefined;
  };

  @ApiPropertyOptional()
  errorCode?: string;
}
