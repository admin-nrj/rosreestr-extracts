import { WinstonModule, utilities as nestWinstonModuleUtilities } from 'nest-winston';
import * as winston from 'winston';
import DailyRotateFile = require('winston-daily-rotate-file');

export interface LoggerConfig {
  /**
   * Name of the service/processor (used for log filename and context)
   */
  serviceName: string;

  /**
   * Directory where logs will be stored
   * @default 'logs'
   */
  logsDir?: string;

  /**
   * Number of days to keep logs
   * @default 14
   */
  maxFiles?: string | number;

  /**
   * Maximum size of each log file
   * @default '20m'
   */
  maxSize?: string;

  /**
   * Log level
   * @default 'info'
   */
  logLevel?: string;

  /**
   * Whether to also log to console
   * @default true in development, false in production
   */
  enableConsole?: boolean;
}

/**
 * Create a Winston logger instance with daily rotation for a specific service
 * Each service will have its own log file with pattern: {serviceName}-YYYY-MM-DD.log
 */
export function createWinstonLogger(config: LoggerConfig) {
  const {
    serviceName,
    logsDir = 'logs',
    maxFiles = '14d',
    maxSize = '20m',
    logLevel = process.env['LOG_LEVEL'] || 'info',
    enableConsole = process.env['NODE_ENV'] !== 'production',
  } = config;

  const transports: winston.transport[] = [];

  // Daily rotate file transport for this specific service
  const fileTransport = new DailyRotateFile({
    dirname: logsDir,
    filename: `${serviceName}-%DATE%.log`,
    datePattern: 'YYYY-MM-DD',
    maxSize,
    maxFiles,
    format: winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.errors({ stack: true }),
      winston.format.printf((info) => {
        const { timestamp, message, stack, level:_, ...meta } = info as {
          timestamp: string;
          message: string;
          stack?: string;
          level: string;
          [key: string]: unknown;
        };
        // Format: timestamp message
        // Exclude level from meta output
        const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : '';
        const stackStr = stack ? `\n${stack}` : '';
        return `${timestamp} ${message}${metaStr}${stackStr}`;
      })
    ),
  });

  transports.push(fileTransport);

  // Console transport (optional, useful for development)
  if (enableConsole) {
    const consoleTransport = new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss.SSS' }),
        winston.format.ms(),
        nestWinstonModuleUtilities.format.nestLike(serviceName, {
          colors: true,
          prettyPrint: true,
        })
      ),
    });
    transports.push(consoleTransport);
  }

  return WinstonModule.createLogger({
    level: logLevel,
    transports,
  });
}

/**
 * Predefined logger configurations for different processors
 */
export const LOGGER_CONFIGS = {
  ORDER_PROCESSOR: {
    serviceName: 'order-processor',
  },
  ORDER_DOWNLOAD_PROCESSOR: {
    serviceName: 'order-download-processor',
  },
  WORKER: {
    serviceName: 'worker',
  },
} as const;
