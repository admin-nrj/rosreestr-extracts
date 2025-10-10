import { Module } from '@nestjs/common';
import { DatabaseModule } from '@rosreestr-extracts/database';
import { DalModule as SharedDalModule } from '@rosreestr-extracts/dal';
import { RefreshTokenEntity } from '@rosreestr-extracts/entities';
import { RefreshTokenRepository } from './repositories/refresh-token.repository';

/**
 * Data Access Layer module
 * Provides repositories for database operations
 */
@Module({
  imports: [
    DatabaseModule.forFeature([RefreshTokenEntity]),
    SharedDalModule,
  ],
  providers: [RefreshTokenRepository],
  exports: [RefreshTokenRepository, SharedDalModule],
})
export class DalModule {}
