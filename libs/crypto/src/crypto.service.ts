import { Inject, Injectable } from '@nestjs/common';
import type { ConfigType } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { appConfig } from '@rosreestr-extracts/config';

@Injectable()
export class CryptoService {
  constructor(
    @Inject(appConfig.KEY)
    private readonly app: ConfigType<typeof appConfig>,
  ) {}

  async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(this.app.bcryptSaltRounds);
    return bcrypt.hash(password, salt);
  }

  async comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}
