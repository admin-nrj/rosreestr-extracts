import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DalModule } from './dal/dal.module';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { UserEntity } from '@rosreestr-extracts/entities';
import { appConfig } from '@rosreestr-extracts/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { USERS_PACKAGE_NAME, USERS_SERVICE_NAME } from '@rosreestr-extracts/interfaces';
import { USERS_PROTO_PATH } from '@rosreestr-extracts/proto';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: USERS_SERVICE_NAME,
        imports: [ConfigModule],
        inject: [appConfig.KEY],
        useFactory: (appCfg: ConfigType<typeof appConfig>) => ({
          transport: Transport.GRPC,
          options: {
            package: USERS_PACKAGE_NAME,
            protoPath: USERS_PROTO_PATH,
            url: appCfg.urls.usersService
          }
        }),
      },
    ]),
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),
    DatabaseModule.forRoot({
      entities: [UserEntity],
    }),
    DalModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
