import prisma from '../../config/database';
import { config } from '../../config';
import notificationService from '../notification/notification.service';
import { buildAbandonedCartEmail } from '../notification/email.provider';
import logger from '../../utils/logger';

class AbandonedCartService {
  // Flag carts as abandoned (30 min inactivity, no checkout)
  async detectAbandonedCarts() {
    const threshold = new Date(Date.now() - 30 * 60 * 1000); // 30 minutes ago

    const carts = await prisma.cart.findMany({
      where: {
        isAbandoned: false,
        updatedAt: { lt: threshold },
        items: { some: {} },
        // No order placed from this cart
      },
      include: {
        user: true,
        items: {
          include: {
            product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
          },
        },
      },
    });

    for (const cart of carts) {
      const email = cart.user?.email || null;
      const phone = cart.user?.phone || null;

      if (!email && !phone) continue; // Can't contact guest without info

      const cartValue = cart.items.reduce((sum, item) => {
        return sum + Number(item.lockedSilverRate || 0) * item.quantity;
      }, 0);

      await prisma.$transaction([
        prisma.cart.update({
          where: { id: cart.id },
          data: { isAbandoned: true, abandonedAt: new Date() },
        }),
        prisma.abandonedCart.create({
          data: {
            cartId: cart.id,
            userId: cart.userId,
            email,
            phone,
            cartValue,
            stage: 'DETECTED',
          },
        }),
      ]);
    }

    logger.info(`Detected ${carts.length} abandoned carts`);
  }

  // Process recovery stages
  async processRecoveryQueue() {
    const abandonedCarts = await prisma.abandonedCart.findMany({
      where: {
        recoveredAt: null,
        stage: { notIn: ['RECOVERED', 'EXPIRED'] },
      },
      include: {
        cart: {
          include: {
            items: {
              include: {
                product: { include: { images: { where: { isPrimary: true }, take: 1 } } },
              },
            },
            user: true,
          },
        },
      },
    });

    for (const ac of abandonedCarts) {
      const minutesSinceAbandoned = (Date.now() - ac.createdAt.getTime()) / (1000 * 60);

      try {
        if (ac.stage === 'DETECTED' && minutesSinceAbandoned >= 30) {
          await this.sendStage1Email(ac);
        } else if (ac.stage === 'EMAIL_SENT_1' && minutesSinceAbandoned >= 360) {
          await this.sendStage2SMS(ac);
        } else if (ac.stage === 'SMS_SENT' && minutesSinceAbandoned >= 1440) {
          await this.sendStage3WhatsApp(ac);
        } else if (ac.stage === 'WHATSAPP_SENT' && minutesSinceAbandoned >= 4320) {
          await this.sendStage4FinalEmail(ac);
        } else if (ac.stage === 'EMAIL_SENT_2' && minutesSinceAbandoned >= 10080) {
          // Expire after 7 days
          await prisma.abandonedCart.update({
            where: { id: ac.id },
            data: { stage: 'EXPIRED' },
          });
        }
      } catch (error) {
        logger.error(error, `Failed to process abandoned cart ${ac.id}`);
      }
    }
  }

  private async sendStage1Email(ac: any) {
    if (!ac.email) {
      await prisma.abandonedCart.update({ where: { id: ac.id }, data: { stage: 'EMAIL_SENT_1' } });
      return;
    }

    const resumeLink = `${config.FRONTEND_URL}/cart?recover=${ac.cartId}`;
    const cartItems = ac.cart.items.map((item: any) => ({
      name: item.product.name,
      image: item.product.images[0]?.url || '',
      price: Number(item.lockedSilverRate || 0) * item.quantity,
    }));

    const html = buildAbandonedCartEmail({
      customerName: ac.cart.user?.name || 'there',
      cartItems,
      resumeLink,
    });

    await notificationService.send({
      userId: ac.userId || undefined,
      channel: 'EMAIL',
      type: 'ABANDONED_CART',
      recipient: ac.email,
      subject: 'You left something beautiful behind ✨',
      body: html,
    });

    await prisma.abandonedCart.update({
      where: { id: ac.id },
      data: { stage: 'EMAIL_SENT_1', lastContactedAt: new Date() },
    });
  }

  private async sendStage2SMS(ac: any) {
    if (!ac.phone) {
      await prisma.abandonedCart.update({ where: { id: ac.id }, data: { stage: 'SMS_SENT' } });
      return;
    }

    const resumeLink = `${config.FRONTEND_URL}/cart?recover=${ac.cartId}`;

    await notificationService.send({
      userId: ac.userId || undefined,
      channel: 'SMS',
      type: 'ABANDONED_CART',
      recipient: ac.phone,
      body: `Hi ${ac.cart.user?.name || ''}! Your jewellery is waiting. Complete your purchase: ${resumeLink} - Jewelup by Sarita`,
    });

    await prisma.abandonedCart.update({
      where: { id: ac.id },
      data: { stage: 'SMS_SENT', lastContactedAt: new Date() },
    });
  }

  private async sendStage3WhatsApp(ac: any) {
    if (!ac.phone) {
      await prisma.abandonedCart.update({ where: { id: ac.id }, data: { stage: 'WHATSAPP_SENT' } });
      return;
    }

    // Generate a discount coupon for WhatsApp stage
    const discountCode = `COMEBACK${Date.now().toString(36).toUpperCase()}`;
    await prisma.coupon.create({
      data: {
        code: discountCode,
        description: 'Abandoned cart recovery coupon',
        discountType: 'PERCENTAGE',
        discountValue: 5,
        usageLimit: 1,
        perCustomerLimit: 1,
        applicableTo: 'CART',
        startsAt: new Date(),
        expiresAt: new Date(Date.now() + 72 * 60 * 60 * 1000), // 72 hours
        isActive: true,
      },
    });

    const resumeLink = `${config.FRONTEND_URL}/cart?recover=${ac.cartId}&coupon=${discountCode}`;
    const productImage = ac.cart.items[0]?.product?.images[0]?.url;

    await notificationService.send({
      userId: ac.userId || undefined,
      channel: 'WHATSAPP',
      type: 'ABANDONED_CART',
      recipient: ac.phone,
      body: `Hi ${ac.cart.user?.name || ''}! Your cart at Jewelup is waiting. Use code ${discountCode} for 5% off! Shop now: ${resumeLink}`,
      metadata: { mediaUrl: productImage },
    });

    await prisma.abandonedCart.update({
      where: { id: ac.id },
      data: { stage: 'WHATSAPP_SENT', lastContactedAt: new Date(), discountCodeUsed: discountCode },
    });
  }

  private async sendStage4FinalEmail(ac: any) {
    if (!ac.email) {
      await prisma.abandonedCart.update({ where: { id: ac.id }, data: { stage: 'EMAIL_SENT_2' } });
      return;
    }

    const discountCode = ac.discountCodeUsed || `FINAL${Date.now().toString(36).toUpperCase()}`;
    const resumeLink = `${config.FRONTEND_URL}/cart?recover=${ac.cartId}&coupon=${discountCode}`;
    const cartItems = ac.cart.items.map((item: any) => ({
      name: item.product.name,
      image: item.product.images[0]?.url || '',
      price: Number(item.lockedSilverRate || 0) * item.quantity,
    }));

    const html = buildAbandonedCartEmail({
      customerName: ac.cart.user?.name || 'there',
      cartItems,
      resumeLink,
      discountCode,
      discountPercent: 10,
    });

    await notificationService.send({
      userId: ac.userId || undefined,
      channel: 'EMAIL',
      type: 'ABANDONED_CART',
      recipient: ac.email,
      subject: 'Last chance! 10% off your cart 💎',
      body: html,
    });

    await prisma.abandonedCart.update({
      where: { id: ac.id },
      data: { stage: 'EMAIL_SENT_2', lastContactedAt: new Date() },
    });
  }

  // Mark cart as recovered when order is placed
  async markRecovered(cartId: string, orderId: string, channel?: string) {
    const ac = await prisma.abandonedCart.findUnique({ where: { cartId } });
    if (ac && !ac.recoveredAt) {
      await prisma.abandonedCart.update({
        where: { id: ac.id },
        data: {
          stage: 'RECOVERED',
          recoveredAt: new Date(),
          recoveredOrderId: orderId,
        },
      });

      // Tag the order with recovery channel
      if (channel) {
        await prisma.order.update({
          where: { id: orderId },
          data: { recoveryChannel: channel },
        });
      }
    }
  }

  // Admin: get abandoned carts list
  async getAbandonedCarts(page: number, limit: number) {
    const [carts, total] = await Promise.all([
      prisma.abandonedCart.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          cart: {
            include: {
              items: { include: { product: { select: { name: true, sku: true } } } },
              user: { select: { name: true, email: true, phone: true } },
            },
          },
        },
      }),
      prisma.abandonedCart.count(),
    ]);

    return { carts, total };
  }

  // Admin: get recovery metrics
  async getRecoveryMetrics(days: number = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

    const [total, recovered, byChannel] = await Promise.all([
      prisma.abandonedCart.count({ where: { createdAt: { gte: since } } }),
      prisma.abandonedCart.count({ where: { createdAt: { gte: since }, stage: 'RECOVERED' } }),
      prisma.order.groupBy({
        by: ['recoveryChannel'],
        where: {
          recoveryChannel: { not: null },
          createdAt: { gte: since },
        },
        _count: true,
        _sum: { grandTotal: true },
      }),
    ]);

    const recoveredRevenue = await prisma.order.aggregate({
      where: {
        recoveryChannel: { not: null },
        createdAt: { gte: since },
      },
      _sum: { grandTotal: true },
    });

    return {
      totalAbandoned: total,
      totalRecovered: recovered,
      recoveryRate: total > 0 ? ((recovered / total) * 100).toFixed(1) : '0',
      revenueRecovered: Number(recoveredRevenue._sum.grandTotal || 0),
      byChannel: byChannel.map((c) => ({
        channel: c.recoveryChannel,
        count: c._count,
        revenue: Number(c._sum.grandTotal || 0),
      })),
    };
  }

  // Admin: manually trigger a recovery message
  async manualOutreach(abandonedCartId: string, channel: 'EMAIL' | 'SMS' | 'WHATSAPP', message: string) {
    const ac = await prisma.abandonedCart.findUnique({
      where: { id: abandonedCartId },
    });

    if (!ac) throw new Error('Abandoned cart not found');

    const recipient = channel === 'EMAIL' ? ac.email : ac.phone;
    if (!recipient) throw new Error(`No ${channel.toLowerCase()} for this cart`);

    await notificationService.send({
      userId: ac.userId || undefined,
      channel,
      type: 'ABANDONED_CART',
      recipient,
      subject: channel === 'EMAIL' ? 'A message from Jewelup by Sarita' : undefined,
      body: message,
    });

    await prisma.abandonedCart.update({
      where: { id: ac.id },
      data: { lastContactedAt: new Date() },
    });
  }
}

export const abandonedCartService = new AbandonedCartService();
export default abandonedCartService;
