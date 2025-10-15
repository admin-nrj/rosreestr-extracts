import { Module } from '@nestjs/common';
import { UserEntity, RosreestrUserEntity } from '@rosreestr-extracts/entities';
import { UserRepository } from './repositories/user.repository';
import { RosreestrUserRepository } from './repositories/rosreestr-user.repository';
import { DatabaseModule } from '@rosreestr-extracts/database';

/**
 * Data Access Layer Module
 * Provides repositories for database operations
 */
@Module({
  imports: [DatabaseModule.forFeature([UserEntity, RosreestrUserEntity])],
  providers: [UserRepository, RosreestrUserRepository],
  exports: [UserRepository, RosreestrUserRepository],
})
export class DalModule {}
