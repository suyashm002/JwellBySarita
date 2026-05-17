import { Request, Response, NextFunction } from 'express';
import { abandonedCartService } from './abandonedCart.service';
import { sendSuccess, sendPaginated, sendError } from '../../utils/apiResponse';

export async function getAbandonedCarts(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { carts, total } = await abandonedCartService.getAbandonedCarts(page, limit);
    return sendPaginated(res, carts, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getRecoveryMetrics(req: Request, res: Response, next: NextFunction) {
  try {
    const days = parseInt(req.query.days as string) || 30;
    const metrics = await abandonedCartService.getRecoveryMetrics(days);
    return sendSuccess(res, metrics);
  } catch (error) {
    next(error);
  }
}

export async function manualOutreach(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const { channel, message } = req.body;
    await abandonedCartService.manualOutreach(id, channel, message);
    return sendSuccess(res, null, 'Message sent successfully');
  } catch (error) {
    next(error);
  }
}
