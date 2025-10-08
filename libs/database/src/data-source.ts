import { DataSource, DataSourceOptions } from 'typeorm';
import { UserEntity, RefreshTokenEntity } from '@rosreestr-extracts/entities';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: ['.env.local', '.env'] });

/**
 * TypeORM DataSource configuration for migrations
 * This is used by TypeORM CLI for running migrations
 */
export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'rosreestr_extracts',
  entities: [UserEntity, RefreshTokenEntity],
  migrations: ['libs/database/src/migrations/*.ts'],
  synchronize: false, // Always false for production
  logging: process.env.DB_LOGGING === 'true',
};

const dataSource = new DataSource(dataSourceOptions);

export default dataSource;
