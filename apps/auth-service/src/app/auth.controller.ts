import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  ValidateTokenRequest,
  ValidateTokenResponse
} from '@rosreestr-extracts/interfaces';

@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  constructor(private readonly authService: AuthService) {}

  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(request);
  }

  async validateToken(request: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    return this.authService.validateToken(request.token);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(request.refreshToken);
  }
}
