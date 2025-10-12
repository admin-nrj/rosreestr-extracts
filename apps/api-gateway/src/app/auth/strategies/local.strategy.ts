import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AUTH_PACKAGE_NAME, AUTH_SERVICE_NAME, AuthServiceClient } from '@rosreestr-extracts/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { UserDto } from '../../common/dto/response.dto';
import { throwOnGrpcError } from '@rosreestr-extracts/utils';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(@Inject(AUTH_PACKAGE_NAME) private readonly client: ClientGrpc) {
    super({
      usernameField: 'email',
      passwordField: 'password',
    });
  }

  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async validate(email: string, password: string): Promise<UserDto> {
    const response = await firstValueFrom(
      this.authService.login({ email, password })
        .pipe(throwOnGrpcError())
    );

    return response.user;
  }
}
