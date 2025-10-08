/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AuthModule } from './app/auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { AUTH_PROTO_PATH } from '@rosreestr-extracts/proto';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AuthModule, {
    transport: Transport.GRPC,
    options: {
      package: AUTH_PACKAGE_NAME,
      protoPath: AUTH_PROTO_PATH,
    }
  });

  await app.listen();
  Logger.log('🚀 Auth service is running GRPC');
}

bootstrap();
