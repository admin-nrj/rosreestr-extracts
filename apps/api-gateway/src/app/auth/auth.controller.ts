import { Body, Controller, Get, Inject, Post, UseGuards } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { RegisterDto } from './dto/register.dto';
import { AuthResponseDto } from './dto/auth-response.dto';
import { AUTH_PACKAGE_NAME, AUTH_SERVICE_NAME, AuthServiceClient } from '@rosreestr-extracts/interfaces';
import { Logger } from '@nestjs/common';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { LocalAuthGuard } from '../common/guards/local-auth.guard';
import { UserDto } from '../common/dto/response.dto';
import { JwtRefreshAuthGuard } from '../common/guards/jwt-refresh-auth.guard';
import { BearerToken } from '../common/decorators/bearer-token.decorator';
import { BaseGrpcController } from '../common/base-grpc.controller';

@Controller('auth')
export class AuthController extends BaseGrpcController<AuthServiceClient> {
  constructor(@Inject(AUTH_PACKAGE_NAME) client: ClientGrpc) {
    super(client, AUTH_SERVICE_NAME);
  }

  @Post('register')
  async register(@Body() registerDto: RegisterDto): Promise<AuthResponseDto> {
    Logger.log('[register] registerDto:', registerDto);
    const response = await this.callGrpc(
      this.service.register({
        email: registerDto.email,
        password: registerDto.password,
        name: registerDto.name,
        pbxExtension: registerDto.pbxExtension,
      })
    );

    Logger.log('[register] auth-response:', response);

    return {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      user: response.user,
    };
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@CurrentUser() user: UserDto): Promise<AuthResponseDto> {
    console.log('[login] user:', user);
    const response = await this.callGrpc(
      this.service.generateTokens({
        id: user.userId,
        email: user.email,
        name: user.name,
        role: user.role,
      })
    );

    return { accessToken: response.accessToken, refreshToken: response.refreshToken, user };
  }

  @UseGuards(JwtRefreshAuthGuard)
  @Get('refresh')
  async refresh(@BearerToken() bearerToken: string): Promise<AuthResponseDto> {
    return await this.callGrpc(this.service.refreshToken({ refreshToken: bearerToken }));
  }
}
