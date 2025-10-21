/**
 * Payload for order processing jobs
 */
export interface OrderJobData {
  orderId: number;
  cadNum: string;
  userId: number; // Owner of the order
}

/**
 * Payload for check and download order jobs
 */
export interface CheckAndDownloadOrderJobData {
  orderId: number;
  rosreestrOrderNum: string;
}

/**
 * Result of order processing
 */
export interface OrderProcessingResult {
  rosreestrOrderNum?: string;
  error?: string;
}
