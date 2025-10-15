/**
 * Order Processing Worker
 * Standalone application that processes orders from the queue
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { AppModule } from './app/app.module';
import { setupGracefulShutdown } from '@rosreestr-extracts/utils';
import { appConfig } from '@rosreestr-extracts/config';

async function bootstrap() {
  const logger = new Logger('OrderProcessingWorker');

  // Create application context (no HTTP server needed)
  const app = await NestFactory.createApplicationContext(AppModule);

  // Get configuration
  const appCfg = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const rosreestrUserName = appCfg.worker.rosreestrUserName;

  logger.log(`🚀 Order Processing Worker started`);
  logger.log(`📋 Rosreestr Username: ${rosreestrUserName}`);
  logger.log(`🔄 Waiting for orders from queue...`);

  // Setup graceful shutdown
  setupGracefulShutdown(app, 'Order Processing Worker');
}

bootstrap().catch(err => {
  console.error('Failed to start worker:', err);
  process.exit(1);
});
