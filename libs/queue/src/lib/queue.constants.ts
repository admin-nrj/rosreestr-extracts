/**
 * Queue names used throughout the application
 */
export const ORDER_QUEUE_NAME = 'order-processing';

/**
 * Job names within the order processing queue
 */
export const ORDER_JOB_NAMES = {
  PROCESS_ORDER: 'process-order',
  CHECK_AND_DOWNLOAD_ORDER: 'check-and-download-order',
} as const;

/**
 * Queue configuration constants
 */
export const QUEUE_CONFIG = {
  DEFAULT_JOB_OPTIONS: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 10000, // 10 seconds initial delay
    },
    removeOnComplete: true,
    removeOnFail: false, // Keep failed jobs for debugging
  },
  CONCURRENCY: {
    ORDER_PROCESSING: 1, // Process one order at a time per worker
  },
} as const;
