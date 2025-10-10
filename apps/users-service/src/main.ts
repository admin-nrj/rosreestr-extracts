/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { AppModule } from './app/app.module';
import { logger } from 'nx/src/utils/logger';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { USERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { USERS_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';

async function bootstrap() {
  // Create temporary app context to get config
  const appContext = await NestFactory.createApplicationContext(AppModule);
  const appCfg = appContext.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const url = appCfg.urls.usersService;
  await appContext.close();

  // Create microservice with configured port
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AppModule,{
    transport: Transport.GRPC,
    options:{
      package: USERS_PACKAGE_NAME,
      protoPath: USERS_PROTO_PATH,
      url
    }
  });

  await app.listen();
  Logger.log(`🚀 Users service is running on gRPC ${url}`);
  logger.log(`🚀🚀 NX LOGGER Users service is running on gRPC ${url}`);
}

bootstrap().catch(err => { throw err });
