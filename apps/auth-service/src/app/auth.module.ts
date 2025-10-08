import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CryptoModule } from '@rosreestr-extracts/crypto';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { jwtConfig } from '@rosreestr-extracts/config';
import { UserEntity } from '@rosreestr-extracts/entities';
import { DalModule } from './dal/dal.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [jwtConfig],
      envFilePath: ['.env.local', '.env']
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get<string>('jwt.secret'),
        signOptions: {
          expiresIn: configService.get<string>('jwt.expiresIn'),
        },
      }),
    }),
    DatabaseModule.forRoot({
      entities: [UserEntity],
    }),
    CryptoModule,
    DalModule,
  ],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}
