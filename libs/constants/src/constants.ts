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

  /** Префикс для ошибок (за ним следует текст ошибки) */
  ERROR_PREFIX = 'Ошибка: ',
}
