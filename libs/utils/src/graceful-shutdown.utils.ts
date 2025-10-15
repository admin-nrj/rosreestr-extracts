/**
 * Setup graceful shutdown handlers for SIGINT and SIGTERM signals
 * @param app - NestJS application instance (INestApplication or INestMicroservice)
 * @param serviceName - Optional service name for logging context
 */
export function setupGracefulShutdown(
  app: { close: () => Promise<void> },
  serviceName?: string
): void {
  // Use console.log for graceful shutdown messages
  // NestJS Logger might not be available during shutdown
  const logMessage = (signal: string) => {
    const prefix = serviceName ? `[${serviceName}] ` : '';
    console.log(`${prefix}Received ${signal}, closing application...`);
  };

  process.on('SIGINT', () => {
    void (async () => {
      logMessage('SIGINT');
      await app.close();
      process.exit(0);
    })();
  });

  process.on('SIGTERM', () => {
    void (async () => {
      logMessage('SIGTERM');
      await app.close();
      process.exit(0);
    })();
  });
}
