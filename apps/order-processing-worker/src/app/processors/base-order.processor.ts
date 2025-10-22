import { LoggerService } from '@nestjs/common';
import { Job, Queue } from 'bull';
import { firstValueFrom } from 'rxjs';
import { OrderEntity } from '@rosreestr-extracts/entities';
import { convertDatesToTimestamp, getErrorMessage, getErrorStack } from '@rosreestr-extracts/utils';
import { OrderStatus } from '@rosreestr-extracts/constants';
import { QUEUE_CONFIG } from '@rosreestr-extracts/queue';
import { BaseRosreestrProcessor } from './base-rosreestr.processor';

/**
 * Base abstract class for Order processors
 * Extends BaseRosreestrProcessor with common order processing logic
 */
export abstract class BaseOrderProcessor extends BaseRosreestrProcessor {
  protected abstract readonly logger: LoggerService;

  /**
   * Update order status via gRPC
   */
  protected async updateOrder(orderId: number, updates: Partial<OrderEntity>): Promise<void> {
    // Ensure initialized if rosreestrUserId is being used
    if (updates.rosreestrUserId !== undefined && !this.isInitialized) {
      await this.ensureInitialized();
    }

    this.logger.log('[updateOrder] update', updates);
    try {
      const response = await firstValueFrom(
        this.ordersServiceClient.updateOrder(
          convertDatesToTimestamp({
            id: orderId,
            ...updates,
          })
        )
      );

      this.logger.log('[updateOrder] response', response);

      if (response.error) {
        throw new Error(`Failed to update order: ${response.error.message}`);
      }
    } catch (error) {
      this.logger.error(`Failed to update order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Calculate if job has retries left based on Bull job configuration
   */
  protected hasRetriesLeft(job: Job): boolean {
    const configuredAttempts = job.opts?.attempts ?? QUEUE_CONFIG.DEFAULT_JOB_OPTIONS.attempts;
    const maxAttempts = typeof configuredAttempts === 'number' ? configuredAttempts : 1;
    return job.attemptsMade + 1 < maxAttempts;
  }

  /**
   * Log retry attempt information
   */
  protected logRetryAttempt(job: Job): void {
    const configuredAttempts = job.opts?.attempts ?? QUEUE_CONFIG.DEFAULT_JOB_OPTIONS.attempts;
    const maxAttempts = typeof configuredAttempts === 'number' ? configuredAttempts : 1;
    this.logger.warn(`[Job ${job.id}] Retrying (attempt ${job.attemptsMade + 1}/${maxAttempts})...`);
  }

  /**
   * Handle job error with automatic retry logic
   * @param job - Bull job
   * @param orderId - Order ID
   * @param error - Error that occurred
   * @param onMaxAttemptsReached - Callback when max attempts are exhausted
   */
  protected async handleJobError(
    job: Job,
    orderId: number,
    error: Error,
    onMaxAttemptsReached?: (job: Job) => Promise<void>
  ): Promise<void> {
    const errorMessage = getErrorMessage(error);
    const errorStack = getErrorStack(error);

    this.logger.error(`[Job ${job.id}] Error processing order ${orderId}: ${errorMessage}`, errorStack);

    const hasRetries = this.hasRetriesLeft(job);

    if (hasRetries) {
      // Re-throw to trigger Bull retry
      this.logRetryAttempt(job);
      throw error;
    }

    // Max attempts reached
    if (onMaxAttemptsReached) {
      await onMaxAttemptsReached(job);
    }
  }

  /**
   * Requeue job at the end of the queue (for PROCESS_ORDER jobs)
   * Used when max retry attempts are exhausted
   */
  protected async requeueAtEnd<T>(
    job: Job<T>,
    queue: Queue<T>,
    jobName: string,
    orderId: number
  ): Promise<void> {
    this.logger.warn(
      `[Job ${job.id}] Max attempts reached for order ${orderId}. Requeueing at the end of the queue.`
    );

    await this.updateOrder(orderId, {
      status: OrderStatus.QUEUED,
      isComplete: false,
    });

    await queue.add(jobName, job.data, { ...QUEUE_CONFIG.DEFAULT_JOB_OPTIONS });

    this.logger.log(`[Job ${job.id}] Order ${orderId} queued for another retry after exhausting attempts.`);
  }

  /**
   * Requeue job at the beginning of the queue (for CHECK_AND_DOWNLOAD_ORDER jobs)
   * Used when max retry attempts are exhausted
   */
  protected async requeueAtBeginning<T>(
    job: Job<T>,
    queue: Queue<T>,
    jobName: string,
    orderId: number
  ): Promise<void> {
    this.logger.warn(
      `[Job ${job.id}] Max attempts reached for order ${orderId}. Requeueing at the beginning of the queue.`
    );

    await queue.add(jobName, job.data, {
      ...QUEUE_CONFIG.DEFAULT_JOB_OPTIONS,
      priority: 1, // Higher priority to add at the beginning
    });

    this.logger.log(`[Job ${job.id}] Order ${orderId} requeued at the beginning for another retry.`);
  }
}
