import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { AUTH_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';
import { UsersController } from './users.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: AUTH_PACKAGE_NAME,
        imports: [ConfigModule],
        inject: [appConfig.KEY],
        useFactory: (appCfg: ConfigType<typeof appConfig>) => ({
          transport: Transport.GRPC,
          options: {
            package: AUTH_PACKAGE_NAME,
            protoPath: AUTH_PROTO_PATH,
            url: appCfg.urls.authService
          }
        })
      },
    ]),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
