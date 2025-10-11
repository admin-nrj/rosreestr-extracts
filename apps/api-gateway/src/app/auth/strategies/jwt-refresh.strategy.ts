import { Injectable, Inject, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import type { ConfigType } from '@nestjs/config';
import { jwtConfig } from '@rosreestr-extracts/config';

export interface JwtRefreshPayload {
  sub: number;
  email: string;
}

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, 'jwt-refresh') {
  constructor(@Inject(jwtConfig.KEY) private jwt: ConfigType<typeof jwtConfig>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwt.refreshSecret,
    });
  }

  validate(payload: JwtRefreshPayload): { userId: number; email: string } {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Невалидный refresh токен');
    }

    return {
      userId: payload.sub,
      email: payload.email,
    };
  }
}
