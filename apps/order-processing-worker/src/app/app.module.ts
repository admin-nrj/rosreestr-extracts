import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderProcessor } from './order.processor';
import { QueueModule } from '@rosreestr-extracts/queue';
import { DalModule } from '@rosreestr-extracts/dal';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { CryptoModule } from '@rosreestr-extracts/crypto';
import { databaseConfig, appConfig, redisConfig, cryptoConfig } from '@rosreestr-extracts/config';
import { RosreestrUserEntity } from '@rosreestr-extracts/entities';
import { ORDERS_PACKAGE_NAME, ROSREESTR_USERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { ORDERS_PROTO_PATH, ROSREESTR_USERS_PROTO_PATH } from '@rosreestr-extracts/proto';

/**
 * Worker Module
 * Processes orders from the queue
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, redisConfig, cryptoConfig],
    }),
    DatabaseModule.forRoot({
      entities: [RosreestrUserEntity],
    }),
    QueueModule.forConsumer(),
    DalModule,
    CryptoModule,
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
      {
        name: ROSREESTR_USERS_PACKAGE_NAME,
        imports: [ConfigModule],
        inject: [appConfig.KEY],
        useFactory: (appCfg: ConfigType<typeof appConfig>) => ({
          transport: Transport.GRPC,
          options: {
            package: ROSREESTR_USERS_PACKAGE_NAME,
            protoPath: ROSREESTR_USERS_PROTO_PATH,
            url: appCfg.urls.rosreestrUsersService,
            loader: {
              arrays: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [
    OrderProcessor
  ],
})
export class AppModule {}
