import { registerAs } from '@nestjs/config';

export default registerAs('crypto', () => ({
  rrSecret: process.env.ROSREESTR_CRYPTO_SECRET,
}));
