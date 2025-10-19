import { Module } from '@nestjs/common';
import { RedisPubSubModule } from '@rosreestr-extracts/redis-pubsub';
import { CodesController } from './codes.controller';
import { CodesService } from './codes.service';

/**
 * Module for receiving and delivering verification codes to workers
 */
@Module({
  imports: [RedisPubSubModule],
  controllers: [CodesController],
  providers: [CodesService],
})
export class CodesModule {}
