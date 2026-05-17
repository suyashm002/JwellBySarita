import { createServer } from 'http';
import app from './app';
import { config } from './config';
import { startAbandonedCartWorker } from './jobs/abandonedCartWorker';
import logger from './utils/logger';

const httpServer = createServer(app);

// Start background jobs
startAbandonedCartWorker();

httpServer.listen(config.PORT, () => {
  logger.info(`Server running on port ${config.PORT}`);
  logger.info(`Environment: ${config.NODE_ENV}`);
  logger.info(`Frontend URL: ${config.FRONTEND_URL}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM received, shutting down...');
  httpServer.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});
