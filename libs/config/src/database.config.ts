import { registerAs } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export default registerAs(
  'database',
  (): TypeOrmModuleOptions => ({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'rosreestr_extracts',
    entities: [],
    synchronize: false, // IMPORTANT: Always false, use migrations instead
    logging: process.env.DB_LOGGING === 'true',
    migrations: ['dist/libs/database/src/migrations/*.js'],
    migrationsRun: process.env.DB_MIGRATIONS_RUN === 'true',
  })
);
