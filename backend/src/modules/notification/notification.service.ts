import prisma from '../../config/database';
import { sendEmail, EmailOptions } from './email.provider';
import { sendSMS, SMSOptions } from './sms.provider';
import { sendWhatsApp, WhatsAppOptions } from './whatsapp.provider';
import logger from '../../utils/logger';

type Channel = 'EMAIL' | 'SMS' | 'WHATSAPP';
type NotificationType =
  | 'ORDER_CONFIRMATION'
  | 'ORDER_STATUS_UPDATE'
  | 'SHIPPING_UPDATE'
  | 'ABANDONED_CART'
  | 'OTP'
  | 'RETURN_UPDATE'
  | 'PRICE_DROP_ALERT'
  | 'BACK_IN_STOCK';

interface NotificationPayload {
  userId?: string;
  channel: Channel;
  type: NotificationType;
  recipient: string;
  subject?: string;
  body: string;
  metadata?: Record<string, unknown>;
}

class NotificationService {
  async send(payload: NotificationPayload): Promise<boolean> {
    let success = false;

    try {
      switch (payload.channel) {
        case 'EMAIL':
          success = await sendEmail({
            to: payload.recipient,
            subject: payload.subject || 'Jewelup by Sarita',
            html: payload.body,
          });
          break;

        case 'SMS':
          success = await sendSMS({
            to: payload.recipient,
            message: payload.body,
          });
          break;

        case 'WHATSAPP':
          success = await sendWhatsApp({
            to: payload.recipient,
            message: payload.body,
            mediaUrl: payload.metadata?.mediaUrl as string | undefined,
          });
          break;
      }

      await prisma.notificationLog.create({
        data: {
          userId: payload.userId,
          channel: payload.channel,
          type: payload.type,
          recipient: payload.recipient,
          subject: payload.subject,
          body: payload.body,
          status: success ? 'SENT' : 'FAILED',
          metadata: payload.metadata as any,
        },
      });
    } catch (error) {
      logger.error(error, 'Notification send failed');
    }

    return success;
  }

  async sendOrderConfirmation(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true, items: true },
    });

    if (!order || !order.user) return;

    if (order.user.email) {
      await this.send({
        userId: order.userId,
        channel: 'EMAIL',
        type: 'ORDER_CONFIRMATION',
        recipient: order.user.email,
        subject: `Order Confirmed - ${order.orderNumber}`,
        body: `Your order ${order.orderNumber} has been confirmed. Total: ₹${Number(order.grandTotal).toLocaleString('en-IN')}`,
      });
    }

    if (order.user.phone) {
      await this.send({
        userId: order.userId,
        channel: 'SMS',
        type: 'ORDER_CONFIRMATION',
        recipient: order.user.phone,
        subject: undefined,
        body: `Order ${order.orderNumber} confirmed! Total: Rs.${Number(order.grandTotal).toLocaleString('en-IN')}. Track at jewelupbysarita.com/order/${order.id}`,
      });
    }
  }

  async sendOrderStatusUpdate(orderId: string, status: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { user: true },
    });

    if (!order || !order.user) return;

    const statusMessages: Record<string, string> = {
      PACKED: 'Your order has been packed and is ready for dispatch.',
      DISPATCHED: `Your order has been dispatched. ${order.trackingNumber ? `Tracking: ${order.trackingNumber}` : ''}`,
      OUT_FOR_DELIVERY: 'Your order is out for delivery!',
      DELIVERED: 'Your order has been delivered. Thank you for shopping with us!',
      CANCELLED: 'Your order has been cancelled.',
    };

    const message = statusMessages[status] || `Order status updated to ${status}`;

    if (order.user.email) {
      await this.send({
        userId: order.userId,
        channel: 'EMAIL',
        type: 'ORDER_STATUS_UPDATE',
        recipient: order.user.email,
        subject: `Order ${order.orderNumber} - ${status}`,
        body: message,
      });
    }

    if (order.user.phone) {
      await this.send({
        userId: order.userId,
        channel: 'SMS',
        type: 'ORDER_STATUS_UPDATE',
        recipient: order.user.phone,
        body: `Jewelup: ${message} Order #${order.orderNumber}`,
      });
    }
  }
}

export const notificationService = new NotificationService();
export default notificationService;
