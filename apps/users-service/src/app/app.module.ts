import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DalModule } from './dal/dal.module';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { UserEntity } from '@rosreestr-extracts/entities';
import { appConfig } from '@rosreestr-extracts/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env']
    }),
    DatabaseModule.forRoot({
      entities: [UserEntity],
    }),
    DalModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
