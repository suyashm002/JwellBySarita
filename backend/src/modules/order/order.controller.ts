import { Request, Response, NextFunction } from 'express';
import { orderService } from './order.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  ReturnRequestInput,
  ProcessReturnInput,
} from './order.schema';

export class OrderController {
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const data = req.body as CreateOrderInput;

      const order = await orderService.createOrder(userId, data);

      return sendSuccess(res, order, 'Order created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const { orders, total } = await orderService.getOrders(userId, page, limit);

      return sendPaginated(res, orders, total, page, limit, 'Orders fetched');
    } catch (error) {
      next(error);
    }
  }

  async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const order = await orderService.getOrderById(id, userId);

      return sendSuccess(res, order, 'Order details fetched');
    } catch (error) {
      next(error);
    }
  }

  async getAllOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const filters = {
        status: req.query.status as string | undefined,
        startDate: req.query.startDate as string | undefined,
        endDate: req.query.endDate as string | undefined,
        search: req.query.search as string | undefined,
      };

      const { orders, total } = await orderService.getAllOrders(page, limit, filters);

      return sendPaginated(res, orders, total, page, limit, 'Orders fetched');
    } catch (error) {
      next(error);
    }
  }

  async updateStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const { status, note } = req.body as UpdateOrderStatusInput;

      const order = await orderService.updateStatus(id, status, note);

      return sendSuccess(res, order, 'Order status updated');
    } catch (error) {
      next(error);
    }
  }

  async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;

      const order = await orderService.cancelOrder(id, userId);

      return sendSuccess(res, order, 'Order cancelled successfully');
    } catch (error) {
      next(error);
    }
  }

  async requestReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = req.params.id as string;
      const data = req.body as ReturnRequestInput;

      const returnRequest = await orderService.requestReturn(id, userId, data);

      return sendSuccess(res, returnRequest, 'Return request submitted', 201);
    } catch (error) {
      next(error);
    }
  }

  async processReturn(req: Request, res: Response, next: NextFunction) {
    try {
      const returnId = req.params.returnId as string;
      const { approve, adminNote, refundAmount } = req.body as ProcessReturnInput;

      const result = await orderService.processReturn(
        returnId,
        approve,
        adminNote,
        refundAmount
      );

      return sendSuccess(
        res,
        result,
        approve ? 'Return approved' : 'Return rejected'
      );
    } catch (error) {
      next(error);
    }
  }

  async getOrderStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await orderService.getOrderStats();

      return sendSuccess(res, stats, 'Order stats fetched');
    } catch (error) {
      next(error);
    }
  }

  async getInvoice(req: Request, res: Response, next: NextFunction) {
    try {
      const id = req.params.id as string;
      const userId = req.user!.id;

      // Verify user owns this order (unless admin)
      if (req.user!.role !== 'ADMIN') {
        await orderService.getOrderById(id, userId);
      }

      const invoice = await orderService.generateInvoice(id);

      return sendSuccess(res, invoice, 'Invoice generated');
    } catch (error) {
      next(error);
    }
  }
}

export const orderController = new OrderController();
