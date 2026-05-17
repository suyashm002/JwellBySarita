import { Request, Response, NextFunction } from 'express';
import { paymentService } from './payment.service';
import { orderService } from '../order/order.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

export class PaymentController {
  /**
   * Create a Razorpay order for an existing order
   */
  async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { orderId } = req.body;

      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      // Verify user owns the order
      const order = await orderService.getOrderById(orderId, userId);

      if (order.paymentStatus === 'PAID') {
        throw new AppError('This order has already been paid', 400);
      }

      if (order.status === 'CANCELLED') {
        throw new AppError('Cannot pay for a cancelled order', 400);
      }

      // If Razorpay order already exists, return it
      if (order.razorpayOrderId) {
        return sendSuccess(
          res,
          {
            razorpayOrderId: order.razorpayOrderId,
            amount: Math.round(Number(order.grandTotal) * 100),
            currency: 'INR',
            orderId: order.id,
            orderNumber: order.orderNumber,
          },
          'Payment order retrieved'
        );
      }

      const rpOrder = await paymentService.createRazorpayOrder(
        Number(order.grandTotal),
        order.id,
        { orderNumber: order.orderNumber }
      );

      return sendSuccess(
        res,
        {
          ...rpOrder,
          orderId: order.id,
          orderNumber: order.orderNumber,
        },
        'Payment order created',
        201
      );
    } catch (error) {
      next(error);
    }
  }

  /**
   * Verify payment after Razorpay checkout
   */
  async verifyPayment(req: Request, res: Response, next: NextFunction) {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
        throw new AppError('Missing payment verification parameters', 400);
      }

      const result = await paymentService.verifyPayment(
        razorpay_order_id,
        razorpay_payment_id,
        razorpay_signature
      );

      return sendSuccess(res, result, 'Payment verified successfully');
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle Razorpay webhook
   */
  async webhook(req: Request, res: Response, next: NextFunction) {
    try {
      const signature = req.headers['x-razorpay-signature'] as string;

      if (!signature) {
        return sendError(res, 'Missing webhook signature', 400);
      }

      // req.body should be raw string for signature verification
      const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);

      const result = await paymentService.processWebhook(body, signature);

      return res.status(200).json(result);
    } catch (error) {
      // Webhooks should return 200 even on processing errors to prevent retries
      // unless it's a signature verification failure
      if (error instanceof AppError && error.statusCode === 400) {
        return sendError(res, error.message, 400);
      }

      // Log the error but return 200 to Razorpay
      console.error('Webhook processing error:', error);
      return res.status(200).json({ status: 'error_logged' });
    }
  }

  /**
   * Initiate a refund (admin)
   */
  async refund(req: Request, res: Response, next: NextFunction) {
    try {
      const { orderId, amount } = req.body;

      if (!orderId) {
        throw new AppError('orderId is required', 400);
      }

      const order = await orderService.getOrderById(orderId);

      if (!order.razorpayPaymentId) {
        throw new AppError('No payment found for this order', 400);
      }

      if (order.paymentStatus !== 'PAID') {
        throw new AppError('Order payment status must be PAID to initiate refund', 400);
      }

      const refundAmount = amount || Number(order.grandTotal);
      if (refundAmount > Number(order.grandTotal)) {
        throw new AppError('Refund amount cannot exceed order total', 400);
      }

      const refund = await paymentService.initiateRefund(
        order.razorpayPaymentId,
        refundAmount,
        { orderId: order.id, orderNumber: order.orderNumber }
      );

      return sendSuccess(res, refund, 'Refund initiated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const paymentController = new PaymentController();
