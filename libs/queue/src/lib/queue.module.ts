import { Module, DynamicModule } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { redisConfig } from '@rosreestr-extracts/config';
import { ORDER_QUEUE_NAME } from './queue.constants';

@Module({})
export class QueueModule {
  /**
   * Register QueueModule with Bull configuration
   * This should be imported in the root module of services that need queue functionality
   */
  static forRoot(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        ConfigModule.forFeature(redisConfig),
        BullModule.forRootAsync({
          imports: [ConfigModule.forFeature(redisConfig)],
          useFactory: (config: ConfigType<typeof redisConfig>) => ({
            redis: {
              host: config.host,
              port: config.port,
              password: config.password,
              db: config.db,
            },
          }),
          inject: [redisConfig.KEY],
        }),
        BullModule.registerQueue({
          name: ORDER_QUEUE_NAME,
        }),
      ],
      exports: [BullModule],
    };
  }

  /**
   * Register QueueModule for consumers (workers)
   * Workers need to register the queue without forRoot
   */
  static forConsumer(): DynamicModule {
    return {
      module: QueueModule,
      imports: [
        ConfigModule.forFeature(redisConfig),
        BullModule.forRootAsync({
          imports: [ConfigModule.forFeature(redisConfig)],
          useFactory: (config: ConfigType<typeof redisConfig>) => ({
            redis: {
              host: config.host,
              port: config.port,
              password: config.password,
              db: config.db,
            },
          }),
          inject: [redisConfig.KEY],
        }),
        BullModule.registerQueue({
          name: ORDER_QUEUE_NAME,
        }),
      ],
      exports: [BullModule],
    };
  }
}
