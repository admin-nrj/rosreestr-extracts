/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { AuthModule } from './app/auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { AUTH_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';
import { setupGracefulShutdown } from '@rosreestr-extracts/utils';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AuthModule);
  const appCfg = appContext.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const url = appCfg.urls.authService;
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.GRPC,
    options: {
      package: AUTH_PACKAGE_NAME,
      protoPath: AUTH_PROTO_PATH,
      url
    }
  });

  await app.listen();
  Logger.log(`🚀 Auth service is running on gRPC ${url}`);

  // Setup graceful shutdown
  setupGracefulShutdown(app, 'Auth Service');
}

bootstrap().catch((err) => {
  console.error('Failed to start Auth service:', err);
  process.exit(1);
});

