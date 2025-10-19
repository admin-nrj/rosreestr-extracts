import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig, appConfig } from '@rosreestr-extracts/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { RosreestrUsersModule } from './rosreestr-users/rosreestr-users.module';
import { CodesModule } from './codes/codes.module';
import { BullBoardModule } from '@bull-board/nestjs';
import { ExpressAdapter } from '@bull-board/express';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { QueueModule } from '@rosreestr-extracts/queue';

const isDevelopment = process.env.NODE_ENV !== 'production';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, appConfig],
      envFilePath: ['.env.local', '.env']
    }),
    ...(isDevelopment ? [
      QueueModule.forRoot(),
      BullBoardModule.forRoot({
        route: '/queues',
        adapter: ExpressAdapter,
      }),
      BullBoardModule.forFeature({
        name: 'order-processing',
        adapter: BullAdapter,
      }),
    ] : []),
    AuthModule,
    UsersModule,
    OrdersModule,
    RosreestrUsersModule,
    CodesModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
