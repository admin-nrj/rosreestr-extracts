/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigType } from '@nestjs/config';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app/app.module';
import { appConfig } from '@rosreestr-extracts/config';
import { setupGracefulShutdown } from '@rosreestr-extracts/utils';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      stopAtFirstError: true,
    })
  );

  const appCfg = app.get<ConfigType<typeof appConfig>>(appConfig.KEY);
  const port = appCfg.ports.apiGateway;

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  // Swagger setup
  const config = new DocumentBuilder()
    .setTitle('Rosreestr Extracts API')
    .setDescription('API documentation for Rosreestr Extracts microservices')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(port);
  Logger.log(`🚀 API Gateway is running on: http://localhost:${port}/${globalPrefix}`);
  Logger.log(`📚 Swagger documentation available at: http://localhost:${port}/${globalPrefix}/docs`);

  // Setup graceful shutdown
  setupGracefulShutdown(app, 'API Gateway');
}

bootstrap().catch((err) => {
  console.error('Failed to start API Gateway:', err);
  process.exit(1);
});
