import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { redisConfig } from '@rosreestr-extracts/config';
import { RedisPubSubService } from './services/redis-pubsub.service';
import { RedisSubscriberService } from './services/redis-subscriber.service';

/**
 * Module providing Redis Pub/Sub functionality for code delivery
 *
 * Usage in API Gateway (publisher):
 * - Import RedisPubSubModule
 * - Inject RedisPubSubService
 * - Use publishCode() to send codes
 *
 * Usage in Worker (subscriber):
 * - Import RedisPubSubModule
 * - Inject RedisSubscriberService
 * - Use waitForCode() to receive codes
 */
@Module({
  imports: [ConfigModule.forFeature(redisConfig)],
  providers: [RedisPubSubService, RedisSubscriberService],
  exports: [RedisPubSubService, RedisSubscriberService],
})
export class RedisPubSubModule {}
