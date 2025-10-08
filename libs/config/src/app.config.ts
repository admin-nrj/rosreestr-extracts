import { registerAs } from '@nestjs/config';
import { DEFAULT_NODE_ENV } from '@rosreestr-extracts/constants';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV ?? DEFAULT_NODE_ENV,
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
}));
