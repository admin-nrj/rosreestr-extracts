import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConfig } from '@rosreestr-extracts/config';
import { getCodeChannelName } from '@rosreestr-extracts/constants';
import { CodeDeliveryMessage, PublishCodeOptions } from '../interfaces/code-delivery.interface';

/**
 * Service for publishing verification codes to Redis Pub/Sub channels
 */
@Injectable()
export class RedisPubSubService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisPubSubService.name);
  private readonly redisClient: Redis;

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>
  ) {
    // Create Redis client for publishing
    this.redisClient = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis publisher connected');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis publisher error:', error);
    });
  }

  /**
   * Publish a verification code to the appropriate channel
   * @param options - Code publishing options
   * @returns Number of subscribers who received the message (0 if no one is waiting)
   */
  async publishCode(options: PublishCodeOptions): Promise<number> {
    const { rosreestrUserName, type, code, filePath } = options;

    const channel = getCodeChannelName(rosreestrUserName, type);

    // Check if anyone is subscribed to this channel
    const subscribersCount = await this.getSubscribersCount(channel);

    if (subscribersCount === 0) {
      this.logger.warn(`No subscribers waiting for ${type} code on channel: ${channel}`);
      this.logger.warn(`Code will not be published as no worker is waiting for it`);
      return 0;
    }

    const message: CodeDeliveryMessage = {
      type,
      code,
      rosreestrUserName,
      timestamp: Date.now(),
      filePath,
    };

    try {
      this.logger.log(`Publishing ${type} code to channel: ${channel}`);

      const publishedCount = await this.redisClient.publish(channel, JSON.stringify(message));

      this.logger.log(`Code published successfully. Subscribers: ${publishedCount}`);

      return publishedCount;
    } catch (error) {
      this.logger.error(`Failed to publish code to channel ${channel}:`, error);
      throw error;
    }
  }

  /**
   * Get the number of subscribers to a channel
   * @param channel - Channel name
   * @returns Number of active subscribers
   */
  private async getSubscribersCount(channel: string): Promise<number> {
    try {
      // PUBSUB NUMSUB returns array: [channel1, count1, channel2, count2, ...]
      const result = await this.redisClient.pubsub('NUMSUB', channel);

      // Result format: [channel, count]
      if (Array.isArray(result) && result.length >= 2) {
        return parseInt(result[1] as string, 10) || 0;
      }

      return 0;
    } catch (error) {
      this.logger.error(`Failed to get subscribers count for channel ${channel}:`, error);
      return 0;
    }
  }

  /**
   * Check if Redis connection is ready
   */
  isReady(): boolean {
    return this.redisClient.status === 'ready';
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('Closing Redis publisher connection');
    await this.redisClient.quit();
  }
}
