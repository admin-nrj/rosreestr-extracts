/**
 * Rosreestr Users Service
 * gRPC microservice for managing Rosreestr user accounts (workers)
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { RosreestrUsersModule } from './app/rosreestr-users.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ROSREESTR_USERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { ROSREESTR_USERS_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';
import { setupGracefulShutdown } from '@rosreestr-extracts/utils';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(RosreestrUsersModule);
  const appCfg = appContext.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const port = appCfg.ports.rosreestrUsersService;
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(RosreestrUsersModule, {
    transport: Transport.GRPC,
    options: {
      package: ROSREESTR_USERS_PACKAGE_NAME,
      protoPath: ROSREESTR_USERS_PROTO_PATH,
      url: `0.0.0.0:${port}`,
    },
  });

  await app.listen();
  Logger.log(`🚀 Rosreestr Users service is running on gRPC ${port}`);

  // Setup graceful shutdown
  setupGracefulShutdown(app, 'Rosreestr Users Service');
}

bootstrap().catch((err) => {
  console.error('Failed to start Rosreestr Users service:', err);
  process.exit(1);
});
