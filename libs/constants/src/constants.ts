export const DEFAULT_NODE_ENV = 'development';

/**
 * Order Status Enum
 * Статусы для жизненного цикла заказа выписок из Росреестра
 */
export enum OrderStatus {
  /** Заказ создан и добавлен в очередь */
  QUEUED = 'Добавлен в очередь',

  /** Заказ взят в работу worker'ом */
  PROCESSING = 'В обработке',

  /** Заказ успешно выполнен */
  COMPLETED = 'Выполнен',

  /** Заказ успешно выполнен */
  REGISTERED = 'Зарегистрирован в росреестре',

  /** Файлы заказа загружены */
  DOWNLOADED = 'Файлы загружены',

  /** Префикс для ошибок (за ним следует текст ошибки) */
  ERROR_PREFIX = 'Ошибка: ',

  CAD_NUM_NOT_FOUND_ON_PORTAL = 'Кадастровый номер не найден на портале',

  /** Недостаточно доступных заказов на балансе */
  INSUFFICIENT_BALANCE = 'Недостаточно доступных заказов на балансе'

}

/**
 * Redis Pub/Sub Code Delivery Constants
 */

/**
 * Prefix for all code delivery channels
 */
export const CODE_DELIVERY_CHANNEL_PREFIX = 'codes';

/**
 * Default timeout for waiting for a code (5 minutes)
 */
export const DEFAULT_CODE_TIMEOUT_MS = 5 * 60 * 1000;

/**
 * Generate channel name for code delivery
 * Format: codes:{rosreestrUserName}:{type}
 * @param rosreestrUserName - Username waiting for code
 * @param type - Type of code (sms or captcha)
 * @returns Channel name
 */
export function getCodeChannelName(rosreestrUserName: string, type: string): string {
  // Sanitize username to prevent injection attacks
  const sanitizedUserName = rosreestrUserName.replace(/[^a-zA-Z0-9@._-]/g, '_');
  return `${CODE_DELIVERY_CHANNEL_PREFIX}:${sanitizedUserName}:${type}`;
}
