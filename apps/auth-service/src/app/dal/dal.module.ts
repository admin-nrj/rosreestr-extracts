import { Module } from '@nestjs/common';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { UserEntity, RefreshTokenEntity } from '@rosreestr-extracts/entities';
import { UserRepository } from './repositories/user.repository';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

/**
 * Data Access Layer module
 * Provides repositories for database operations
 */
@Module({
  imports: [DatabaseModule.forFeature([UserEntity, RefreshTokenEntity])],
  providers: [UserRepository, RefreshTokenRepository],
  exports: [UserRepository, RefreshTokenRepository],
})
export class DalModule {}
