/**
 * Server Entry Point
 * Starts the Express server and handles graceful shutdown
 */

import app from './app';
import { config } from './config/env';
import { logger } from './middleware/logger';

const PORT = config.server.port;

// Start server
const server = app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`, {
    port: PORT,
    env: config.server.nodeEnv,
    aiModel: config.openai.model,
    aiBatchSize: config.openai.batchSize,
  });
});

// Graceful shutdown
function shutdown(signal: string): void {
  logger.info(`${signal} received. Starting graceful shutdown...`);

  server.close((err) => {
    if (err) {
      logger.error('Error during server shutdown', { error: err.message });
      process.exit(1);
    }
    logger.info('Server closed successfully');
    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown due to timeout');
    process.exit(1);
  }, 10000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  logger.error('Uncaught exception', { error: error.message, stack: error.stack });
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled rejection', { reason });
  shutdown('unhandledRejection');
});
