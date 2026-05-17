import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

class CouponService {
  async getAll(page: number, limit: number) {
    const [coupons, total] = await Promise.all([
      prisma.coupon.findMany({
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.coupon.count(),
    ]);
    return { coupons, total };
  }

  async getById(id: string) {
    return prisma.coupon.findUnique({ where: { id } });
  }

  async create(data: {
    code: string;
    description?: string;
    discountType: 'FLAT' | 'PERCENTAGE';
    discountValue: number;
    minimumCartValue?: number;
    maximumDiscount?: number;
    usageLimit?: number;
    perCustomerLimit?: number;
    applicableCategories?: string[];
    applicableTo?: string;
    isFirstOrderOnly?: boolean;
    isAutoApply?: boolean;
    startsAt: Date;
    expiresAt: Date;
  }) {
    const existing = await prisma.coupon.findUnique({ where: { code: data.code } });
    if (existing) throw new AppError('Coupon code already exists', 400);

    return prisma.coupon.create({ data: data as any });
  }

  async update(id: string, data: Record<string, unknown>) {
    return prisma.coupon.update({ where: { id }, data: data as any });
  }

  async delete(id: string) {
    return prisma.coupon.update({ where: { id }, data: { isActive: false } });
  }

  async validate(code: string, cartValue: number, userId?: string, categoryIds?: string[]) {
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon || !coupon.isActive) {
      throw new AppError('Invalid coupon code', 400);
    }

    const now = new Date();
    if (now < coupon.startsAt || now > coupon.expiresAt) {
      throw new AppError('Coupon has expired', 400);
    }

    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('Coupon usage limit reached', 400);
    }

    if (coupon.minimumCartValue && cartValue < Number(coupon.minimumCartValue)) {
      throw new AppError(`Minimum cart value of ₹${coupon.minimumCartValue} required`, 400);
    }

    if (userId && coupon.perCustomerLimit) {
      const userUsage = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });
      if (userUsage >= coupon.perCustomerLimit) {
        throw new AppError('Coupon already used', 400);
      }
    }

    if (userId && coupon.isFirstOrderOnly) {
      const orderCount = await prisma.order.count({ where: { userId } });
      if (orderCount > 0) {
        throw new AppError('Coupon is for first-time customers only', 400);
      }
    }

    if (coupon.applicableCategories && coupon.applicableCategories.length > 0 && categoryIds) {
      const hasMatch = categoryIds.some((id) => coupon.applicableCategories.includes(id));
      if (!hasMatch) {
        throw new AppError('Coupon not applicable to items in your cart', 400);
      }
    }

    // Calculate discount
    let discount = 0;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = (cartValue * Number(coupon.discountValue)) / 100;
      if (coupon.maximumDiscount) {
        discount = Math.min(discount, Number(coupon.maximumDiscount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    discount = Math.min(discount, cartValue);

    return { coupon, discount: Math.round(discount * 100) / 100 };
  }

  async recordUsage(couponId: string, userId: string, orderId: string, discountApplied: number) {
    await prisma.$transaction([
      prisma.couponUsage.create({
        data: { couponId, userId, orderId, discountApplied },
      }),
      prisma.coupon.update({
        where: { id: couponId },
        data: { usedCount: { increment: 1 } },
      }),
    ]);
  }

  async getAutoApplyCoupons(cartValue: number) {
    const now = new Date();
    return prisma.coupon.findMany({
      where: {
        isAutoApply: true,
        isActive: true,
        startsAt: { lte: now },
        expiresAt: { gte: now },
        OR: [
          { minimumCartValue: null },
          { minimumCartValue: { lte: cartValue } },
        ],
      },
    });
  }
}

export const couponService = new CouponService();
export default couponService;
