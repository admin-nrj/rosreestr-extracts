import { Body, Controller, Inject, OnModuleInit, Post } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AUTH_PACKAGE_NAME, AUTH_SERVICE_NAME, AuthServiceClient } from '@rosreestr-extracts/interfaces';
import { throwIfError } from './utils/error-mapper.util';
import { firstValueFrom } from 'rxjs';
import { Logger } from '@nestjs/common';

@Controller('auth')
export class AuthController implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(
    @Inject(AUTH_PACKAGE_NAME) private readonly client: ClientGrpc
  ) {}

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    Logger.log('[register] registerDto:', registerDto);
    const response = await firstValueFrom(
      this.authService.register({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        pbxExtension: registerDto.pbxExtension
      })
    );

    Logger.log('[register] auth-response:', response);

    throwIfError(response);

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    };
  }

  @Post('login')
  async login(@Body() loginDto: LoginDto): Promise<AuthResponseDto> {
    const response = await firstValueFrom(
      this.authService.login({
        email: loginDto.email,
        password: loginDto.password,
      })
    );

    throwIfError(response);

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    };
  }
}
