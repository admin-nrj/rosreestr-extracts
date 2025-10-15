import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { databaseConfig, appConfig, redisConfig } from '@rosreestr-extracts/config';
import { OrderEntity } from '@rosreestr-extracts/entities';
import { OrderRepository } from '../dal/repositories/order.repository';
import { QueueModule } from '@rosreestr-extracts/queue';

/**
 * Orders module
 * Main module for orders microservice
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig, redisConfig],
    }),
    DatabaseModule.forRoot({
      entities: [OrderEntity],
    }),
    DatabaseModule.forFeature([OrderEntity]),
    QueueModule.forRoot(),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
})
export class OrdersModule {}
