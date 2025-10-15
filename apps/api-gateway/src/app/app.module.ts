import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { ConfigModule } from '@nestjs/config';
import { jwtConfig, appConfig } from '@rosreestr-extracts/config';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { RosreestrUsersModule } from './rosreestr-users/rosreestr-users.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig, appConfig],
      envFilePath: ['.env.local', '.env']
    }),
    AuthModule,
    UsersModule,
    OrdersModule,
    RosreestrUsersModule,
  ],
  controllers: [AppController],
  providers: [],
})
export class AppModule {}
