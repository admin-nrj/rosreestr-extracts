import { Module } from '@nestjs/common';
import { DalModule as SharedDalModule } from '@rosreestr-extracts/dal';

/**
 * Data Access Layer module
 * Re-exports shared DAL module
 */
@Module({
  imports: [SharedDalModule],
  exports: [SharedDalModule],
})
export class DalModule {}
