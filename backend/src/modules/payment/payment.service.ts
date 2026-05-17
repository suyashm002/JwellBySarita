import crypto from 'crypto';
import razorpay from '../../config/razorpay';
import prisma from '../../config/database';
import { config } from '../../config';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';

interface RazorpayOrderResult {
  razorpayOrderId: string;
  amount: number;
  currency: string;
}

export class PaymentService {
  /**
   * Create a Razorpay order
   */
  async createRazorpayOrder(
    amount: number,
    orderId: string,
    notes?: Record<string, string>
  ): Promise<RazorpayOrderResult> {
    try {
      // Razorpay expects amount in paise (smallest currency unit)
      const amountInPaise = Math.round(amount * 100);

      const rpOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderId,
        notes: {
          orderId,
          ...notes,
        },
      });

      logger.info(
        { razorpayOrderId: rpOrder.id, orderId, amount },
        'Razorpay order created'
      );

      return {
        razorpayOrderId: rpOrder.id,
        amount: amountInPaise,
        currency: 'INR',
      };
    } catch (error: any) {
      logger.error({ error: error.message, orderId }, 'Failed to create Razorpay order');
      throw new AppError('Failed to create payment order. Please try again.', 502);
    }
  }

  /**
   * Verify Razorpay payment signature and update order
   */
  async verifyPayment(
    razorpayOrderId: string,
    razorpayPaymentId: string,
    razorpaySignature: string
  ): Promise<{ verified: boolean; order: any }> {
    // Verify HMAC signature
    const body = `${razorpayOrderId}|${razorpayPaymentId}`;
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_KEY_SECRET)
      .update(body)
      .digest('hex');

    const isValid = expectedSignature === razorpaySignature;

    if (!isValid) {
      logger.warn(
        { razorpayOrderId, razorpayPaymentId },
        'Payment signature verification failed'
      );
      throw new AppError('Payment verification failed. Invalid signature.', 400);
    }

    // Find and update the order
    const order = await prisma.order.findFirst({
      where: { razorpayOrderId },
    });

    if (!order) {
      throw new AppError('Order not found for this payment', 404);
    }

    if (order.paymentStatus === 'PAID') {
      logger.info({ orderId: order.id }, 'Payment already verified');
      return { verified: true, order };
    }

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          razorpayPaymentId,
          razorpaySignature,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CONFIRMED',
          note: `Payment verified. Razorpay Payment ID: ${razorpayPaymentId}`,
        },
      });

      return updated;
    });

    logger.info(
      { orderId: order.id, razorpayPaymentId },
      'Payment verified successfully'
    );

    return { verified: true, order: updatedOrder };
  }

  /**
   * Process Razorpay webhook events
   */
  async processWebhook(
    body: string,
    signature: string
  ): Promise<{ status: string }> {
    // Verify webhook signature
    const expectedSignature = crypto
      .createHmac('sha256', config.RAZORPAY_WEBHOOK_SECRET)
      .update(body)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('Webhook signature verification failed');
      throw new AppError('Invalid webhook signature', 400);
    }

    const event = JSON.parse(body);
    const eventType = event.event;

    logger.info({ eventType, payloadId: event.payload?.payment?.entity?.id }, 'Webhook received');

    switch (eventType) {
      case 'payment.captured': {
        await this.handlePaymentCaptured(event.payload.payment.entity);
        break;
      }
      case 'payment.failed': {
        await this.handlePaymentFailed(event.payload.payment.entity);
        break;
      }
      case 'refund.processed': {
        await this.handleRefundProcessed(event.payload.refund.entity);
        break;
      }
      default: {
        logger.info({ eventType }, 'Unhandled webhook event');
      }
    }

    return { status: 'ok' };
  }

  /**
   * Initiate a refund via Razorpay
   */
  async initiateRefund(
    razorpayPaymentId: string,
    amount: number,
    notes?: Record<string, string>
  ): Promise<any> {
    try {
      const amountInPaise = Math.round(amount * 100);

      const refund = await razorpay.payments.refund(razorpayPaymentId, {
        amount: amountInPaise,
        notes: notes || {},
        speed: 'normal',
      });

      logger.info(
        { razorpayPaymentId, refundId: refund.id, amount },
        'Refund initiated'
      );

      return refund;
    } catch (error: any) {
      logger.error(
        { error: error.message, razorpayPaymentId, amount },
        'Failed to initiate refund'
      );
      throw new AppError('Failed to initiate refund. Please try again.', 502);
    }
  }

  // ─── Private Webhook Handlers ─────────────────────────

  /**
   * Handle payment.captured webhook event
   */
  private async handlePaymentCaptured(payment: any): Promise<void> {
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId },
    });

    if (!order) {
      logger.warn(
        { razorpayOrderId },
        'Order not found for captured payment webhook'
      );
      return;
    }

    if (order.paymentStatus === 'PAID') {
      return; // Already processed
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'PAID',
          status: 'CONFIRMED',
          razorpayPaymentId,
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: 'CONFIRMED',
          note: `Payment captured via webhook. Payment ID: ${razorpayPaymentId}`,
        },
      });
    });

    logger.info(
      { orderId: order.id, razorpayPaymentId },
      'Payment captured via webhook'
    );
  }

  /**
   * Handle payment.failed webhook event
   */
  private async handlePaymentFailed(payment: any): Promise<void> {
    const razorpayOrderId = payment.order_id;

    const order = await prisma.order.findFirst({
      where: { razorpayOrderId },
    });

    if (!order) {
      logger.warn(
        { razorpayOrderId },
        'Order not found for failed payment webhook'
      );
      return;
    }

    if (order.paymentStatus !== 'PENDING') {
      return; // Already processed
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'FAILED',
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: `Payment failed. Reason: ${payment.error_description || 'Unknown'}`,
        },
      });
    });

    // Restore stock since payment failed
    const orderItems = await prisma.orderItem.findMany({
      where: { orderId: order.id },
    });

    for (const item of orderItems) {
      if (item.variantId) {
        await prisma.productVariant.update({
          where: { id: item.variantId },
          data: { stock: { increment: item.quantity } },
        });
      } else {
        await prisma.product.update({
          where: { id: item.productId },
          data: { stock: { increment: item.quantity } },
        });
      }
    }

    logger.info(
      { orderId: order.id, error: payment.error_description },
      'Payment failed via webhook'
    );
  }

  /**
   * Handle refund.processed webhook event
   */
  private async handleRefundProcessed(refund: any): Promise<void> {
    const razorpayPaymentId = refund.payment_id;

    const order = await prisma.order.findFirst({
      where: { razorpayPaymentId },
    });

    if (!order) {
      logger.warn(
        { razorpayPaymentId },
        'Order not found for refund webhook'
      );
      return;
    }

    await prisma.$transaction(async (tx) => {
      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'REFUNDED',
        },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId: order.id,
          status: order.status,
          note: `Refund processed. Refund ID: ${refund.id}. Amount: ₹${refund.amount / 100}`,
        },
      });

      // Update return request if exists
      if (refund.notes?.returnId) {
        await tx.returnRequest.update({
          where: { id: refund.notes.returnId },
          data: { status: 'REFUNDED' },
        });
      }
    });

    logger.info(
      { orderId: order.id, refundId: refund.id },
      'Refund processed via webhook'
    );
  }
}

export const paymentService = new PaymentService();
