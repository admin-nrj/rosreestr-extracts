import { UserDto } from '../../common/dto/response.dto';
import { ErrorCode } from '@rosreestr-extracts/interfaces';

export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  user?: UserDto;
  error?: {
    message?: string | undefined;
    errorCode?: ErrorCode | undefined;
  };
  errorCode?: string;
}
