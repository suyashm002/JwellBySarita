import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database';
import redis from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import { calculateGST } from '../../utils/gst';
import logger from '../../utils/logger';
import { cartService } from '../cart/cart.service';
import { paymentService } from '../payment/payment.service';
import type {
  CreateOrderInput,
  UpdateOrderStatusInput,
  ReturnRequestInput,
  ProcessReturnInput,
} from './order.schema';

const GIFT_WRAP_CHARGE = 99;
const SHIPPING_INSURANCE_RATE = 0.02; // 2% of order value
const SHIPPING_THRESHOLD = 999;
const SHIPPING_COST = 99;

export class OrderService {
  /**
   * Create a new order from the user's cart
   */
  async createOrder(userId: string, data: CreateOrderInput) {
    // 1. Get cart and validate
    const cartId = await cartService.getOrCreateCart(userId);
    const { items } = await cartService.getCart(cartId);

    if (items.length === 0) {
      throw new AppError('Cart is empty', 400);
    }

    // 2. Validate stock for all items
    for (const item of items) {
      const stockAvailable = item.variant ? item.variant.stock : item.product.stock;
      if (!item.product.isActive) {
        throw new AppError(`Product "${item.product.name}" is no longer available`, 400);
      }
      if (item.quantity > stockAvailable) {
        throw new AppError(
          `Insufficient stock for "${item.product.name}". Only ${stockAvailable} available.`,
          400
        );
      }
    }

    // 3. Get and validate address
    const address = await prisma.address.findFirst({
      where: { id: data.addressId, userId },
    });

    if (!address) {
      throw new AppError('Address not found', 404);
    }

    // 4. Calculate pricing
    const silverRate = await this.getCurrentSilverRate();
    let subtotal = 0;
    let totalSilverCost = 0;
    let totalGemstoneCost = 0;
    let totalMakingCharges = 0;
    let totalAdditionalCharges = 0;

    const orderItemsData = items.map((item) => {
      const silverWeight = Number(item.product.silverWeightGrams);
      // Use locked rate if valid, otherwise current
      const rateUsed = item.lockedSilverRate !== null ? Number(item.lockedSilverRate) : silverRate;

      const silverCost = Math.round(silverWeight * rateUsed * 100) / 100;

      let gemstoneCost = 0;
      if (item.product.gemstones && item.product.gemstones.length > 0) {
        for (const gem of item.product.gemstones) {
          gemstoneCost +=
            Number(gem.caratWeight) * gem.quantity * Number(gem.gemstoneRate.ratePerCarat);
        }
      }
      gemstoneCost = Math.round(gemstoneCost * 100) / 100;

      let makingCharge = 0;
      const makingChargeValue = Number(item.product.makingChargeValue);
      switch (item.product.makingChargeType) {
        case 'FLAT':
          makingCharge = makingChargeValue;
          break;
        case 'PERCENTAGE':
          makingCharge = Math.round((silverCost * makingChargeValue) / 100 * 100) / 100;
          break;
        case 'PER_GRAM':
          makingCharge = Math.round(silverWeight * makingChargeValue * 100) / 100;
          break;
      }

      let additionalCharge = Number(item.product.additionalCharges);
      if (item.variant) {
        additionalCharge += Number(item.variant.additionalPrice);
      }

      const unitPrice =
        Math.round((silverCost + gemstoneCost + makingCharge + additionalCharge) * 100) / 100;
      const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;

      totalSilverCost += silverCost * item.quantity;
      totalGemstoneCost += gemstoneCost * item.quantity;
      totalMakingCharges += makingCharge * item.quantity;
      totalAdditionalCharges += additionalCharge * item.quantity;
      subtotal += totalPrice;

      return {
        productId: item.productId,
        variantId: item.variantId,
        productSnapshot: {
          name: item.product.name,
          sku: item.product.sku,
          slug: item.product.slug,
          silverPurity: item.product.silverPurity,
          silverWeightGrams: silverWeight,
          image: item.product.images?.[0]?.url || null,
          category: item.product.category.name,
          variant: item.variant
            ? { name: item.variant.name, type: item.variant.type, value: item.variant.value }
            : null,
        },
        quantity: item.quantity,
        silverRateUsed: rateUsed,
        silverWeight,
        silverCost: silverCost * item.quantity,
        gemstoneCost: gemstoneCost * item.quantity,
        makingCharge: makingCharge * item.quantity,
        additionalCharge: additionalCharge * item.quantity,
        unitPrice,
        totalPrice,
      };
    });

    // 5. Apply coupon if provided
    let discountAmount = 0;
    let couponCode: string | null = null;

    if (data.couponCode) {
      const couponResult = await cartService.applyCoupon(cartId, data.couponCode, userId);
      discountAmount = couponResult.discount;
      couponCode = data.couponCode;
    } else {
      // Check if coupon was already applied to the cart
      const couponData = await redis.get(`cart:${cartId}:coupon`);
      if (couponData) {
        const parsed = JSON.parse(couponData);
        discountAmount = parsed.discount;
        couponCode = parsed.code;
      }
    }

    // 6. Calculate shipping
    const subtotalAfterDiscount = subtotal - discountAmount;
    const shippingCost = subtotalAfterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // 7. Gift wrap and shipping insurance
    const giftWrapCharge = data.giftWrap ? GIFT_WRAP_CHARGE : 0;
    const shippingInsurance = data.shippingInsurance
      ? Math.round(subtotalAfterDiscount * SHIPPING_INSURANCE_RATE * 100) / 100
      : 0;

    // 8. Calculate GST based on delivery state
    const taxableAmount = subtotalAfterDiscount + shippingCost + giftWrapCharge;
    const gst = calculateGST(taxableAmount, address.state);

    // 9. Grand total
    const grandTotal =
      Math.round((taxableAmount + gst.totalGst + shippingInsurance) * 100) / 100;

    // 10. Generate order number
    const orderNumber = await this.generateOrderNumber();

    // 11. Create order in transaction
    const order = await prisma.$transaction(async (tx) => {
      // Create order
      const newOrder = await tx.order.create({
        data: {
          orderNumber,
          userId,
          status: data.paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
          paymentStatus: data.paymentMethod === 'COD' ? 'PENDING' : 'PENDING',
          paymentMethod: data.paymentMethod,
          addressSnapshot: {
            label: address.label,
            name: address.name,
            phone: address.phone,
            line1: address.line1,
            line2: address.line2,
            city: address.city,
            state: address.state,
            pincode: address.pincode,
          },
          subtotal,
          silverCost: Math.round(totalSilverCost * 100) / 100,
          gemstoneCost: Math.round(totalGemstoneCost * 100) / 100,
          makingCharges: Math.round(totalMakingCharges * 100) / 100,
          additionalCharges: Math.round(totalAdditionalCharges * 100) / 100 + giftWrapCharge,
          discountAmount,
          couponCode,
          shippingCost,
          shippingInsurance,
          taxableAmount,
          cgst: gst.cgst,
          sgst: gst.sgst,
          igst: gst.igst,
          totalGst: gst.totalGst,
          grandTotal,
          silverRateAtOrder: silverRate,
          giftWrap: data.giftWrap,
          giftMessage: data.giftMessage || null,
          notes: data.notes || null,
          items: {
            create: orderItemsData,
          },
          statusHistory: {
            create: {
              status: data.paymentMethod === 'COD' ? 'CONFIRMED' : 'PENDING',
              note: data.paymentMethod === 'COD' ? 'Order placed with Cash on Delivery' : 'Order placed, awaiting payment',
            },
          },
        },
        include: {
          items: true,
          statusHistory: true,
        },
      });

      // Decrement stock
      for (const item of items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { decrement: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { decrement: item.quantity } },
          });
        }
      }

      // Record coupon usage if coupon was applied
      if (couponCode) {
        const coupon = await tx.coupon.findUnique({ where: { code: couponCode } });
        if (coupon) {
          await tx.couponUsage.create({
            data: {
              couponId: coupon.id,
              userId,
              orderId: newOrder.id,
              discountApplied: discountAmount,
            },
          });

          await tx.coupon.update({
            where: { id: coupon.id },
            data: { usedCount: { increment: 1 } },
          });
        }
      }

      return newOrder;
    });

    // 12. Clear cart
    await cartService.clearCart(cartId);

    // 13. Handle payment
    let razorpayOrderId: string | null = null;
    if (data.paymentMethod === 'RAZORPAY') {
      const rpOrder = await paymentService.createRazorpayOrder(
        grandTotal,
        order.id,
        { orderNumber: order.orderNumber }
      );
      razorpayOrderId = rpOrder.razorpayOrderId;

      await prisma.order.update({
        where: { id: order.id },
        data: { razorpayOrderId },
      });
    }

    logger.info(
      { orderId: order.id, orderNumber: order.orderNumber, grandTotal },
      'Order created successfully'
    );

    return {
      ...order,
      razorpayOrderId,
    };
  }

  /**
   * Get paginated orders for a user
   */
  async getOrders(userId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  slug: true,
                  images: { where: { isPrimary: true }, take: 1 },
                },
              },
            },
          },
        },
      }),
      prisma.order.count({ where: { userId } }),
    ]);

    return { orders, total, page, limit };
  }

  /**
   * Get order detail by ID
   */
  async getOrderById(orderId: string, userId?: string) {
    const where: any = { id: orderId };
    if (userId) {
      where.userId = userId;
    }

    const order = await prisma.order.findFirst({
      where,
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                slug: true,
                images: { where: { isPrimary: true }, take: 1 },
              },
            },
            variant: {
              select: { id: true, name: true, type: true, value: true },
            },
          },
        },
        statusHistory: {
          orderBy: { createdAt: 'desc' },
        },
        returns: true,
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    return order;
  }

  /**
   * Get all orders for admin with filters
   */
  async getAllOrders(
    page: number = 1,
    limit: number = 20,
    filters: {
      status?: string;
      startDate?: string;
      endDate?: string;
      search?: string;
    } = {}
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.startDate || filters.endDate) {
      where.createdAt = {};
      if (filters.startDate) {
        where.createdAt.gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        where.createdAt.lte = new Date(filters.endDate);
      }
    }

    if (filters.search) {
      where.OR = [
        { orderNumber: { contains: filters.search, mode: 'insensitive' } },
        { user: { name: { contains: filters.search, mode: 'insensitive' } } },
        { user: { email: { contains: filters.search, mode: 'insensitive' } } },
        { user: { phone: { contains: filters.search } } },
      ];
    }

    const [orders, total] = await Promise.all([
      prisma.order.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: { id: true, name: true, email: true, phone: true },
          },
          items: {
            select: { id: true, productSnapshot: true, quantity: true, totalPrice: true },
          },
        },
      }),
      prisma.order.count({ where }),
    ]);

    return { orders, total, page, limit };
  }

  /**
   * Update order status (admin)
   */
  async updateStatus(orderId: string, status: string, note?: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    // Validate status transition
    this.validateStatusTransition(order.status, status);

    const updatedOrder = await prisma.$transaction(async (tx) => {
      const updated = await tx.order.update({
        where: { id: orderId },
        data: { status: status as any },
      });

      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: status as any,
          note: note || null,
        },
      });

      return updated;
    });

    logger.info(
      { orderId, from: order.status, to: status },
      'Order status updated'
    );

    return updatedOrder;
  }

  /**
   * Cancel order (customer or admin)
   */
  async cancelOrder(orderId: string, userId: string) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId },
      include: { items: true },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
      throw new AppError(
        'Order can only be cancelled when in PENDING or CONFIRMED status',
        400
      );
    }

    const cancelledOrder = await prisma.$transaction(async (tx) => {
      // Update status
      const updated = await tx.order.update({
        where: { id: orderId },
        data: {
          status: 'CANCELLED',
          paymentStatus:
            order.paymentStatus === 'PAID' ? 'REFUNDED' : order.paymentStatus,
        },
      });

      // Add status history
      await tx.orderStatusHistory.create({
        data: {
          orderId,
          status: 'CANCELLED',
          note: 'Cancelled by customer',
        },
      });

      // Restore stock
      for (const item of order.items) {
        if (item.variantId) {
          await tx.productVariant.update({
            where: { id: item.variantId },
            data: { stock: { increment: item.quantity } },
          });
        } else {
          await tx.product.update({
            where: { id: item.productId },
            data: { stock: { increment: item.quantity } },
          });
        }
      }

      return updated;
    });

    // Initiate refund if payment was made
    if (order.paymentStatus === 'PAID' && order.razorpayPaymentId) {
      try {
        await paymentService.initiateRefund(
          order.razorpayPaymentId,
          Number(order.grandTotal),
          { orderId: order.id, reason: 'Customer cancellation' }
        );
      } catch (error) {
        logger.error({ orderId, error }, 'Failed to initiate refund for cancelled order');
      }
    }

    logger.info({ orderId, orderNumber: order.orderNumber }, 'Order cancelled');

    return cancelledOrder;
  }

  /**
   * Request a return for an order
   */
  async requestReturn(
    orderId: string,
    userId: string,
    data: ReturnRequestInput
  ) {
    const order = await prisma.order.findFirst({
      where: { id: orderId, userId, status: 'DELIVERED' },
    });

    if (!order) {
      throw new AppError('Order not found or is not eligible for return', 404);
    }

    // Check return window (e.g., 7 days from delivery)
    const deliveredHistory = await prisma.orderStatusHistory.findFirst({
      where: { orderId, status: 'DELIVERED' },
      orderBy: { createdAt: 'desc' },
    });

    if (deliveredHistory) {
      const daysSinceDelivery = Math.floor(
        (Date.now() - deliveredHistory.createdAt.getTime()) / (1000 * 60 * 60 * 24)
      );
      if (daysSinceDelivery > 7) {
        throw new AppError('Return window has expired (7 days from delivery)', 400);
      }
    }

    // Validate order item if specified
    if (data.orderItemId) {
      const orderItem = await prisma.orderItem.findFirst({
        where: { id: data.orderItemId, orderId },
      });
      if (!orderItem) {
        throw new AppError('Order item not found', 404);
      }
    }

    // Check if return already exists
    const existingReturn = await prisma.returnRequest.findFirst({
      where: {
        orderId,
        orderItemId: data.orderItemId || null,
        status: { in: ['REQUESTED', 'APPROVED', 'PICKED_UP'] },
      },
    });

    if (existingReturn) {
      throw new AppError('A return request already exists for this order/item', 400);
    }

    const returnRequest = await prisma.returnRequest.create({
      data: {
        orderId,
        orderItemId: data.orderItemId || null,
        reason: data.reason,
        description: data.description || null,
        images: [],
      },
    });

    // Update order status
    await prisma.order.update({
      where: { id: orderId },
      data: { status: 'RETURNED' },
    });

    await prisma.orderStatusHistory.create({
      data: {
        orderId,
        status: 'RETURNED',
        note: `Return requested: ${data.reason}`,
      },
    });

    logger.info({ orderId, returnId: returnRequest.id }, 'Return request created');

    return returnRequest;
  }

  /**
   * Process a return request (admin)
   */
  async processReturn(
    returnId: string,
    approve: boolean,
    adminNote?: string,
    refundAmount?: number
  ) {
    const returnRequest = await prisma.returnRequest.findUnique({
      where: { id: returnId },
      include: {
        order: true,
        orderItem: true,
      },
    });

    if (!returnRequest) {
      throw new AppError('Return request not found', 404);
    }

    if (returnRequest.status !== 'REQUESTED') {
      throw new AppError('Return request has already been processed', 400);
    }

    const status = approve ? 'APPROVED' : 'REJECTED';
    const finalRefundAmount = approve
      ? refundAmount || Number(returnRequest.orderItem?.totalPrice || returnRequest.order.grandTotal)
      : null;

    const updatedReturn = await prisma.returnRequest.update({
      where: { id: returnId },
      data: {
        status,
        adminNote: adminNote || null,
        refundAmount: finalRefundAmount,
      },
    });

    // If approved and order was paid, initiate refund
    if (
      approve &&
      finalRefundAmount &&
      returnRequest.order.paymentStatus === 'PAID' &&
      returnRequest.order.razorpayPaymentId
    ) {
      try {
        await paymentService.initiateRefund(
          returnRequest.order.razorpayPaymentId,
          finalRefundAmount,
          {
            orderId: returnRequest.orderId,
            returnId,
            reason: 'Return approved',
          }
        );
      } catch (error) {
        logger.error({ returnId, error }, 'Failed to initiate refund for return');
      }
    }

    // Restore stock if approved
    if (approve) {
      if (returnRequest.orderItem) {
        if (returnRequest.orderItem.variantId) {
          await prisma.productVariant.update({
            where: { id: returnRequest.orderItem.variantId },
            data: { stock: { increment: returnRequest.orderItem.quantity } },
          });
        } else {
          await prisma.product.update({
            where: { id: returnRequest.orderItem.productId },
            data: { stock: { increment: returnRequest.orderItem.quantity } },
          });
        }
      }
    }

    logger.info(
      { returnId, status, refundAmount: finalRefundAmount },
      'Return request processed'
    );

    return updatedReturn;
  }

  /**
   * Get admin dashboard order stats
   */
  async getOrderStats() {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalOrders,
      pendingCount,
      todayOrders,
      monthOrders,
      revenueResult,
      monthRevenueResult,
    ] = await Promise.all([
      prisma.order.count(),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.order.count({ where: { createdAt: { gte: startOfToday } } }),
      prisma.order.count({ where: { createdAt: { gte: startOfMonth } } }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
        },
        _sum: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: {
          paymentStatus: 'PAID',
          createdAt: { gte: startOfMonth },
        },
        _sum: { grandTotal: true },
      }),
    ]);

    const totalRevenue = Number(revenueResult._sum.grandTotal || 0);
    const monthRevenue = Number(monthRevenueResult._sum.grandTotal || 0);
    const aov = totalOrders > 0 ? Math.round((totalRevenue / totalOrders) * 100) / 100 : 0;

    // Status distribution
    const statusDistribution = await prisma.order.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    return {
      totalOrders,
      pendingCount,
      todayOrders,
      monthOrders,
      totalRevenue,
      monthRevenue,
      averageOrderValue: aov,
      statusDistribution: statusDistribution.map((s) => ({
        status: s.status,
        count: s._count.id,
      })),
    };
  }

  /**
   * Generate invoice data for an order
   */
  async generateInvoice(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true },
            },
          },
        },
      },
    });

    if (!order) {
      throw new AppError('Order not found', 404);
    }

    const addressSnapshot = order.addressSnapshot as {
      name: string;
      phone: string;
      line1: string;
      line2?: string;
      city: string;
      state: string;
      pincode: string;
    };

    return {
      invoiceNumber: `INV-${order.orderNumber}`,
      invoiceDate: order.createdAt,
      order: {
        orderNumber: order.orderNumber,
        orderDate: order.createdAt,
        status: order.status,
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
      },
      customer: {
        name: order.user.name || addressSnapshot.name,
        email: order.user.email,
        phone: order.user.phone || addressSnapshot.phone,
      },
      shippingAddress: addressSnapshot,
      sellerDetails: {
        name: 'Jewelup by Sarita',
        address: 'Jaipur, Rajasthan, India',
        gstin: 'XXXXXXXXXXXX', // To be configured
        state: 'Rajasthan',
      },
      items: order.items.map((item) => ({
        name: item.product.name,
        sku: item.product.sku,
        quantity: item.quantity,
        silverWeight: Number(item.silverWeight),
        silverRate: Number(item.silverRateUsed),
        silverCost: Number(item.silverCost),
        gemstoneCost: Number(item.gemstoneCost),
        makingCharge: Number(item.makingCharge),
        additionalCharge: Number(item.additionalCharge),
        unitPrice: Number(item.unitPrice),
        totalPrice: Number(item.totalPrice),
      })),
      pricing: {
        subtotal: Number(order.subtotal),
        silverCost: Number(order.silverCost),
        gemstoneCost: Number(order.gemstoneCost),
        makingCharges: Number(order.makingCharges),
        additionalCharges: Number(order.additionalCharges),
        discountAmount: Number(order.discountAmount),
        couponCode: order.couponCode,
        shippingCost: Number(order.shippingCost),
        shippingInsurance: Number(order.shippingInsurance),
        taxableAmount: Number(order.taxableAmount),
        cgst: Number(order.cgst),
        sgst: Number(order.sgst),
        igst: Number(order.igst),
        totalGst: Number(order.totalGst),
        grandTotal: Number(order.grandTotal),
      },
      giftWrap: order.giftWrap,
      giftMessage: order.giftMessage,
    };
  }

  // ─── Private Helpers ──────────────────────────────────

  /**
   * Generate order number in JWL-YYYYMMDD-XXX format
   */
  private async generateOrderNumber(): Promise<string> {
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10).replace(/-/g, '');

    // Get today's order count from Redis for fast incrementing
    const key = `order_count:${dateStr}`;
    const count = await redis.incr(key);

    // Set expiry for next day if this is a new key
    if (count === 1) {
      await redis.expire(key, 86400 * 2); // 2 days TTL
    }

    const paddedCount = count.toString().padStart(3, '0');
    return `JWL-${dateStr}-${paddedCount}`;
  }

  /**
   * Get the current effective silver rate
   */
  private async getCurrentSilverRate(): Promise<number> {
    const cached = await redis.get('current_silver_rate');
    if (cached) {
      return parseFloat(cached);
    }

    const latestRate = await prisma.silverRateLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRate) {
      throw new AppError('Silver rate not available', 503);
    }

    return Number(latestRate.effectiveRate);
  }

  /**
   * Validate that a status transition is allowed
   */
  private validateStatusTransition(currentStatus: string, newStatus: string): void {
    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PACKED', 'CANCELLED'],
      PACKED: ['QUALITY_CHECKED', 'CANCELLED'],
      QUALITY_CHECKED: ['DISPATCHED'],
      DISPATCHED: ['OUT_FOR_DELIVERY'],
      OUT_FOR_DELIVERY: ['DELIVERED'],
      DELIVERED: ['RETURNED'],
      CANCELLED: [],
      RETURNED: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      throw new AppError(
        `Cannot transition from ${currentStatus} to ${newStatus}`,
        400
      );
    }
  }
}

export const orderService = new OrderService();
