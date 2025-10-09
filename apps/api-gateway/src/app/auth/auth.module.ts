import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { AUTH_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { AUTH_PROTO_PATH } from '@rosreestr-extracts/proto';

@Module({
  imports: [
    ClientsModule.register([
      {
        transport: Transport.GRPC,
        name: AUTH_PACKAGE_NAME,
        options: {
          package: AUTH_PACKAGE_NAME,
          protoPath: AUTH_PROTO_PATH
        }
      }
    ])
  ],
  controllers: [AuthController],
})
export class AuthModule { }
