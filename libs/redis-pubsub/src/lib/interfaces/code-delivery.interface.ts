/**
 * Type of verification code
 */
export enum CodeType {
  SMS = 'sms',
  CAPTCHA = 'captcha',
}

/**
 * Message format for code delivery via Redis Pub/Sub
 */
export interface CodeDeliveryMessage {
  /**
   * Type of code (SMS or Captcha)
   */
  type: CodeType;

  /**
   * The verification code
   */
  code: string;

  /**
   * Rosreestr username who needs this code
   */
  rosreestrUserName: string;

  /**
   * Timestamp when the code was sent
   */
  timestamp: number;

  /**
   * Optional file path for captcha images
   */
  filePath?: string;
}

/**
 * Options for publishing a code
 */
export interface PublishCodeOptions {
  rosreestrUserName: string;
  type: CodeType;
  code: string;
  filePath?: string;
}

/**
 * Options for waiting for a code
 */
export interface WaitForCodeOptions {
  rosreestrUserName: string;
  type: CodeType;
  timeoutMs?: number;
}
