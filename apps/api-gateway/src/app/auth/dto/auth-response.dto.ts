import { UserDto } from '../../common/dto/response.dto';

export class AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  user?: UserDto;
  error?: string;
  errorCode?: string;
}
