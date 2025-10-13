import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ORDERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { ORDERS_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';
import { OrdersController } from './orders.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ORDERS_PACKAGE_NAME,
        imports: [ConfigModule],
        inject: [appConfig.KEY],
        useFactory: (appCfg: ConfigType<typeof appConfig>) => ({
          transport: Transport.GRPC,
          options: {
            package: ORDERS_PACKAGE_NAME,
            protoPath: ORDERS_PROTO_PATH,
            url: appCfg.urls.ordersService,
            loader: {
              arrays: true,
            },
          },
        }),
      },
    ]),
  ],
  controllers: [OrdersController],
})
export class OrdersModule {}
