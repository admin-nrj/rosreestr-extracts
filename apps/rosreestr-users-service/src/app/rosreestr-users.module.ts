import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RosreestrUsersController } from './rosreestr-users.controller';
import { RosreestrUsersService } from './rosreestr-users.service';
import { CryptoModule } from '@rosreestr-extracts/crypto';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { appConfig, cryptoConfig } from '@rosreestr-extracts/config';
import { RosreestrUserEntity } from '@rosreestr-extracts/entities';
import { DalModule } from '@rosreestr-extracts/dal';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, cryptoConfig],
      envFilePath: ['.env.local', '.env']
    }),
    DatabaseModule.forRoot({
      entities: [RosreestrUserEntity],
    }),
    CryptoModule,
    DalModule,
  ],
  controllers: [RosreestrUsersController],
  providers: [RosreestrUsersService],
})
export class RosreestrUsersModule {}
