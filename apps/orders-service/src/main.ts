/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { OrdersModule } from './app/orders.module';
import { ORDERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { ORDERS_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(OrdersModule);
  const appCfg = appContext.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const url = appCfg.urls.ordersService;
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    OrdersModule,
    {
      transport: Transport.GRPC,
      options: {
        package: ORDERS_PACKAGE_NAME,
        protoPath: ORDERS_PROTO_PATH,
        url
      }
    }
  );

  await app.listen();
  Logger.log(`🚀 Orders service is running on gRPC ${url}`);
}

bootstrap().catch(err => { throw err });
