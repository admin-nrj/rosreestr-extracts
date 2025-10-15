import { Module } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { ROSREESTR_USERS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { ROSREESTR_USERS_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';
import { RosreestrUsersController } from './rosreestr-users.controller';

@Module({
  imports: [
    ClientsModule.registerAsync([
      {
        name: ROSREESTR_USERS_PACKAGE_NAME,
        imports: [ConfigModule],
        inject: [appConfig.KEY],
        useFactory: (appCfg: ConfigType<typeof appConfig>) => ({
          transport: Transport.GRPC,
          options: {
            package: ROSREESTR_USERS_PACKAGE_NAME,
            protoPath: ROSREESTR_USERS_PROTO_PATH,
            url: appCfg.urls.rosreestrUsersService
          }
        })
      },
    ]),
  ],
  controllers: [RosreestrUsersController],
})
export class RosreestrUsersModule {}
