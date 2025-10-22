import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { OrderProcessor } from './order.processor';
import { OrderDownloadProcessor } from './order-download.processor';
import { QueueModule } from '@rosreestr-extracts/queue';
import { DalModule } from '@rosreestr-extracts/dal';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { CryptoModule } from '@rosreestr-extracts/crypto';
import { RedisPubSubModule } from '@rosreestr-extracts/redis-pubsub';
import { databaseConfig, appConfig, redisConfig, cryptoConfig } from '@rosreestr-extracts/config';
import {
  ORDERS_PACKAGE_NAME,
  ROSREESTR_USERS_PACKAGE_NAME,
  ANOMALY_QUESTIONS_PACKAGE_NAME,
} from '@rosreestr-extracts/interfaces';
import { ORDERS_PROTO_PATH, ROSREESTR_USERS_PROTO_PATH, ANOMALY_QUESTIONS_PROTO_PATH } from '@rosreestr-extracts/proto';
import { UserEntity, RosreestrUserEntity } from '@rosreestr-extracts/entities';
import { RosreestrBrowserService } from './services/rosreestr-browser.service';
import { RosreestrAuthService } from './services/rosreestr-auth.service';
import { RosreestrOrderService } from './services/rosreestr-order.service';
import { RosreestrOrderDownloaderService } from './services/rosreestr-order-downloader.service';
import { FileValidatorService } from './services/file-validator.service';

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
      entities: [UserEntity, RosreestrUserEntity],
    }),
    QueueModule.forConsumer(),
    DalModule,
    CryptoModule,
    RedisPubSubModule,
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
      {
        name: ANOMALY_QUESTIONS_PACKAGE_NAME,
        imports: [ConfigModule],
        inject: [appConfig.KEY],
        useFactory: (appCfg: ConfigType<typeof appConfig>) => ({
          transport: Transport.GRPC,
          options: {
            package: ANOMALY_QUESTIONS_PACKAGE_NAME,
            protoPath: ANOMALY_QUESTIONS_PROTO_PATH,
            url: appCfg.urls.anomalyQuestionsService,
            loader: {
              arrays: true,
            },
          },
        }),
      },
    ]),
  ],
  providers: [
    OrderProcessor,
    OrderDownloadProcessor,
    RosreestrBrowserService,
    RosreestrAuthService,
    RosreestrOrderService,
    RosreestrOrderDownloaderService,
    FileValidatorService,
  ],
})
export class AppModule {}
