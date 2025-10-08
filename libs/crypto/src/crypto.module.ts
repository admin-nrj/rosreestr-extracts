import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { appConfig } from '@rosreestr-extracts/config';
import { CryptoService } from './crypto.service';

@Module({
  imports: [ConfigModule.forFeature(appConfig)],
  providers: [CryptoService],
  exports: [CryptoService],
})
export class CryptoModule {}
