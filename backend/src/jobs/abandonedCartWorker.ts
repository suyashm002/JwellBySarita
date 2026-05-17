import cron from 'node-cron';
import { abandonedCartService } from '../modules/abandoned-cart/abandonedCart.service';
import logger from '../utils/logger';

export function startAbandonedCartWorker() {
  // Detect abandoned carts every 10 minutes
  cron.schedule('*/10 * * * *', async () => {
    try {
      await abandonedCartService.detectAbandonedCarts();
    } catch (error) {
      logger.error(error, 'Abandoned cart detection failed');
    }
  });

  // Process recovery queue every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    try {
      await abandonedCartService.processRecoveryQueue();
    } catch (error) {
      logger.error(error, 'Recovery queue processing failed');
    }
  });

  logger.info('Abandoned cart worker started');
}
