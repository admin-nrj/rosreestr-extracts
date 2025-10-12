import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { databaseConfig, appConfig } from '@rosreestr-extracts/config';
import { OrderEntity } from '@rosreestr-extracts/entities';
import { OrderRepository } from '../dal/repositories/order.repository';

/**
 * Orders module
 * Main module for orders microservice
 */
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [databaseConfig, appConfig],
    }),
    DatabaseModule.forRoot({
      entities: [OrderEntity],
    }),
  ],
  controllers: [OrdersController],
  providers: [OrdersService, OrderRepository],
})
export class OrdersModule {}
