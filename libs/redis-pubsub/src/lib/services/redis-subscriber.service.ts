import { Inject, Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import Redis from 'ioredis';
import { redisConfig } from '@rosreestr-extracts/config';
import { DEFAULT_CODE_TIMEOUT_MS, getCodeChannelName } from '@rosreestr-extracts/constants';
import { getErrorMessage } from '@rosreestr-extracts/utils';
import { CodeDeliveryMessage, CodeType } from '../interfaces/code-delivery.interface';

/**
 * Represents a pending code request waiting for delivery
 */
interface PendingCodeRequest {
  channel: string;
  resolve: (code: string) => void;
  reject: (error: Error) => void;
  timeoutId: NodeJS.Timeout;
  isSubscribed: boolean;
}

/**
 * Service for subscribing to Redis Pub/Sub channels and waiting for verification codes
 */
@Injectable()
export class RedisSubscriberService implements OnModuleDestroy {
  private readonly logger = new Logger(RedisSubscriberService.name);
  private readonly redisClient: Redis;
  private readonly pendingRequests = new Map<string, PendingCodeRequest>();
  private readonly subscribedChannels = new Set<string>();

  constructor(
    @Inject(redisConfig.KEY)
    private readonly config: ConfigType<typeof redisConfig>
  ) {
    // Create Redis client for subscribing
    this.redisClient = new Redis({
      host: this.config.host,
      port: this.config.port,
      password: this.config.password,
      db: this.config.db,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
    });

    this.redisClient.on('connect', () => {
      this.logger.log('Redis subscriber connected');
    });

    this.redisClient.on('error', (error) => {
      this.logger.error('Redis subscriber error:', error);
    });

    // Handle incoming messages
    this.redisClient.on('message', (channel: string, message: string) => {
      this.handleMessage(channel, message);
    });
  }

  /**
   * Subscribe to a code delivery channel
   * This should be called BEFORE the action that triggers code delivery
   * @param rosreestrUserName - Username waiting for the code
   * @param type - Type of code (SMS or Captcha)
   * @returns Channel name that was subscribed to
   */
  async subscribeToCodeChannel(rosreestrUserName: string, type: CodeType): Promise<string> {
    const channel = getCodeChannelName(rosreestrUserName, type);

    // Check if already subscribed
    if (this.subscribedChannels.has(channel)) {
      this.logger.warn(`Already subscribed to channel: ${channel}`);
      return channel;
    }

    try {
      this.logger.log(`Subscribing to ${type} code channel: ${channel}`);
      await this.redisClient.subscribe(channel);
      this.subscribedChannels.add(channel);
      this.logger.log(`Successfully subscribed to channel: ${channel}`);
      return channel;
    } catch (error) {
      this.logger.error(`Failed to subscribe to channel ${channel}:`, error);
      throw new Error(`Failed to subscribe to ${type} code channel: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Unsubscribe from a code delivery channel
   * Use this to clean up subscription if an error occurs before waitForCode()
   * @param channel - Username
   */
  async unsubscribeFromCodeChannel(channel: string): Promise<void> {
    try {
      this.logger.log(`Unsubscribing from code channel: ${channel}`);

      // If there's a pending request, clean it up
      if (this.pendingRequests.has(channel)) {
        this.cleanupRequest(channel);
        this.logger.log(`Cleaned up pending request for channel: ${channel}`);
      } else {
        // Just unsubscribe from channel
        await this.redisClient.unsubscribe(channel);
        this.subscribedChannels.delete(channel);
        this.logger.log(`Unsubscribed from channel: ${channel}`);
      }
    } catch (error) {
      this.logger.error(`Failed to unsubscribe from channel ${channel}:`, error);
      // Don't throw - this is cleanup, best effort
    }
  }

  /**
   * Wait for a verification code to be delivered via Redis Pub/Sub
   * IMPORTANT: You must call subscribeToCodeChannel() BEFORE calling this method
   * @param rosreestrUserName - Username waiting for the code
   * @param type - Type of code (SMS or Captcha)
   * @param timeoutMs - Timeout in milliseconds (default: 5 minutes)
   * @returns Promise that resolves with the code or rejects on timeout
   */
  async waitForCode(
    rosreestrUserName: string,
    type: CodeType,
    timeoutMs: number = DEFAULT_CODE_TIMEOUT_MS
  ): Promise<string> {
    const channel = getCodeChannelName(rosreestrUserName, type);

    this.logger.log(`Waiting for ${type} code on channel: ${channel} (timeout: ${timeoutMs}ms)`);

    // Check if we're subscribed to this channel
    const isSubscribed = this.isChannelSubscribed(channel);
    if (!isSubscribed) {
      this.logger.warn(`Not subscribed to channel ${channel}, subscribing now...`);
      await this.subscribeToCodeChannel(rosreestrUserName, type);
    }

    // Create promise that will be resolved when code arrives or timeout
    return new Promise<string>((resolve, reject) => {
      // Setup timeout
      const timeoutId = setTimeout(() => {
        this.logger.warn(`Timeout waiting for ${type} code on channel: ${channel}`);
        this.cleanupRequest(channel);
        reject(new Error(`Timeout waiting for ${type} code (waited ${timeoutMs}ms)`));
      }, timeoutMs);

      // Store pending request
      this.pendingRequests.set(channel, {
        channel,
        resolve,
        reject,
        timeoutId,
        isSubscribed: true,
      });
    });
  }

  /**
   * Check if we're subscribed to a channel
   * @param channel - Channel name
   * @returns true if subscribed, false otherwise
   */
  private isChannelSubscribed(channel: string): boolean {
    return this.subscribedChannels.has(channel);
  }

  /**
   * Handle incoming message from Redis
   */
  private handleMessage(channel: string, message: string): void {
    this.logger.log(`Received message on channel: ${channel}`);

    const pendingRequest = this.pendingRequests.get(channel);

    if (!pendingRequest) {
      this.logger.warn(`No pending request for channel: ${channel}`);
      return;
    }

    try {
      // Parse message
      const codeMessage = JSON.parse(message) as CodeDeliveryMessage;

      this.logger.log(`Parsed code message:`, {
        type: codeMessage.type,
        rosreestrUserName: codeMessage.rosreestrUserName,
        timestamp: codeMessage.timestamp,
      });

      // Resolve promise with code
      pendingRequest.resolve(codeMessage.code);

      // Cleanup
      this.cleanupRequest(channel);

      this.logger.log(`Code delivered successfully for channel: ${channel}`);
    } catch (error) {
      this.logger.error(`Failed to parse message on channel ${channel}:`, error);
      pendingRequest.reject(new Error(`Failed to parse code message: ${getErrorMessage(error)}`));
      this.cleanupRequest(channel);
    }
  }

  /**
   * Cleanup request and unsubscribe from channel
   */
  private cleanupRequest(channel: string): void {
    const request = this.pendingRequests.get(channel);

    if (request) {
      // Clear timeout
      clearTimeout(request.timeoutId);

      // Remove from pending requests
      this.pendingRequests.delete(channel);

      // Unsubscribe from channel
      this.redisClient.unsubscribe(channel).catch((error) => {
        this.logger.error(`Failed to unsubscribe from channel ${channel}:`, error);
      });

      // Remove from subscribed channels
      this.subscribedChannels.delete(channel);

      this.logger.log(`Cleaned up request for channel: ${channel}`);
    }
  }

  /**
   * Get number of pending code requests
   */
  getPendingRequestsCount(): number {
    return this.pendingRequests.size;
  }

  /**
   * Cleanup on module destroy
   */
  async onModuleDestroy() {
    this.logger.log('Closing Redis subscriber connection');

    // Cleanup all pending requests
    for (const [, request] of this.pendingRequests.entries()) {
      clearTimeout(request.timeoutId);
      request.reject(new Error('Service shutting down'));
    }
    this.pendingRequests.clear();

    // Clear subscribed channels
    this.subscribedChannels.clear();

    // Close connection
    await this.redisClient.quit();
  }
}
