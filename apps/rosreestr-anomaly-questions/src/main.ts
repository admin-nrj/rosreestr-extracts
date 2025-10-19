/**
 * Anomaly Questions gRPC Microservice
 */

import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { AnomalyQuestionsModule } from './app/anomaly-questions.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { ANOMALY_QUESTIONS_PACKAGE_NAME } from '@rosreestr-extracts/interfaces';
import { ANOMALY_QUESTIONS_PROTO_PATH } from '@rosreestr-extracts/proto';
import { appConfig } from '@rosreestr-extracts/config';
import { setupGracefulShutdown } from '@rosreestr-extracts/utils';

async function bootstrap() {
  const appContext = await NestFactory.createApplicationContext(AnomalyQuestionsModule);
  const appCfg = appContext.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const url = appCfg.urls.anomalyQuestionsService;
  await appContext.close();

  const app = await NestFactory.createMicroservice<MicroserviceOptions>(AnomalyQuestionsModule, {
    transport: Transport.GRPC,
    options: {
      package: ANOMALY_QUESTIONS_PACKAGE_NAME,
      protoPath: ANOMALY_QUESTIONS_PROTO_PATH,
      url
    }
  });

  await app.listen();
  Logger.log(`🚀 Anomaly Questions service is running on gRPC ${url}`);

  // Setup graceful shutdown
  setupGracefulShutdown(app, 'Anomaly Questions Service');
}

bootstrap().catch((err) => {
  console.error('Failed to start Anomaly Questions service:', err);
  process.exit(1);
});
