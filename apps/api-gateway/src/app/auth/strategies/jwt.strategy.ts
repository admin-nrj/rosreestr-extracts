import { Injectable, Inject, OnModuleInit } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { UserRole } from '@rosreestr-extracts/entities';
import { jwtConfig } from '@rosreestr-extracts/config';
import { AUTH_PACKAGE_NAME, AUTH_SERVICE_NAME, AuthServiceClient, User } from '@rosreestr-extracts/interfaces';
import { ClientGrpc } from '@nestjs/microservices';
import { firstValueFrom } from 'rxjs';
import { throwOnGrpcError } from '@rosreestr-extracts/utils';

export interface JwtPayload {
  sub: number;
  email: string;
  name: string;
  role: UserRole;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) implements OnModuleInit {
  private authService: AuthServiceClient;

  constructor(
    @Inject(jwtConfig.KEY) private jwt: ConfigType<typeof jwtConfig>,
    @Inject(AUTH_PACKAGE_NAME) private readonly client: ClientGrpc
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.secret,
    });
  }
  onModuleInit() {
    this.authService = this.client.getService<AuthServiceClient>(AUTH_SERVICE_NAME);
  }

  async validate(payload: JwtPayload): Promise<User> {
    const response = await firstValueFrom(
      this.authService.validateToken({ email: payload.email }).pipe(throwOnGrpcError())
    );

    return response.user;
  }
}
