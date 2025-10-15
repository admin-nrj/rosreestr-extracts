/**
 * Payload for order processing jobs
 */
export interface OrderJobData {
  orderId: number;
  cadNum: string;
  userId: number; // Owner of the order
}

/**
 * Result of order processing
 */
export interface OrderProcessingResult {
  rosreestrOrderNum?: string;
  error?: string;
}
