import { Module } from '@nestjs/common';
import { UserEntity } from '@rosreestr-extracts/entities';
import { UserRepository } from './repositories/user.repository';
import { DatabaseModule } from '@rosreestr-extracts/database';

/**
 * Data Access Layer Module
 * Provides repositories for database operations
 */
@Module({
  imports: [DatabaseModule.forFeature([UserEntity])],
  providers: [UserRepository],
  exports: [UserRepository],
})
export class DalModule {}
