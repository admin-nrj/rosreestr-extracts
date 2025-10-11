import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  AuthServiceController,
  AuthServiceControllerMethods,
  GenerateTokensRequest,
  GenerateTokensResponse,
  LoginRequest,
  LoginResponse,
  RefreshTokenRequest,
  RefreshTokenResponse,
  RegisterRequest,
  RegisterResponse,
  ValidateTokenRequest,
  ValidateTokenResponse,
} from '@rosreestr-extracts/interfaces';
import { UserRole } from '@rosreestr-extracts/entities';

@Controller()
@AuthServiceControllerMethods()
export class AuthController implements AuthServiceController {
  constructor(private readonly authService: AuthService) {}
  generateTokens(request: GenerateTokensRequest): Promise<GenerateTokensResponse> {
    return this.authService.generateTokens({ ...request, role: request.role as UserRole });
  }

  async login(request: LoginRequest): Promise<LoginResponse> {
    return this.authService.login(request);
  }

  async register(request: RegisterRequest): Promise<RegisterResponse> {
    return this.authService.register(request);
  }

  async validateToken(request: ValidateTokenRequest): Promise<ValidateTokenResponse> {
    return this.authService.validateToken(request);
  }

  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    return this.authService.refreshToken(request.refreshToken);
  }
}
