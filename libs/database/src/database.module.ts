import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule, TypeOrmModuleOptions } from '@nestjs/typeorm';
import { databaseConfig } from '@rosreestr-extracts/config';

export interface DatabaseModuleOptions {
  entities?: any[];
  migrations?: any[];
}

@Module({})
export class DatabaseModule {
  /**
   * Register database module with custom entities and migrations
   */
  static forRoot(options: DatabaseModuleOptions = {}): DynamicModule {
    return {
      module: DatabaseModule,
      imports: [
        ConfigModule.forFeature(databaseConfig),
        TypeOrmModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (configService: ConfigService) => {
            const dbConfig = configService.get<TypeOrmModuleOptions>('database');
            return {
              ...dbConfig,
              entities: options.entities || [],
              migrations: options.migrations || [],
            };
          },
        }),
      ],
      exports: [TypeOrmModule],
    };
  }

  /**
   * Register repositories for feature modules
   */
  static forFeature(entities: any[]): DynamicModule {
    return TypeOrmModule.forFeature(entities);
  }
}
