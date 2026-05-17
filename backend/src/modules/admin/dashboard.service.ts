import prisma from '../../config/database';
import redis from '../../config/redis';

class DashboardService {
  async getOverview() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(thisWeekStart.getDate() - thisWeekStart.getDay());
    const thisMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);

    const [
      todayOrders,
      weekOrders,
      monthOrders,
      todayRevenue,
      weekRevenue,
      monthRevenue,
      pendingOrders,
      lowStockProducts,
      totalCustomers,
      abandonedCartRate,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: today } } }),
      prisma.order.count({ where: { createdAt: { gte: thisWeekStart } } }),
      prisma.order.count({ where: { createdAt: { gte: thisMonthStart } } }),
      prisma.order.aggregate({
        where: { createdAt: { gte: today }, paymentStatus: 'PAID' },
        _sum: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: thisWeekStart }, paymentStatus: 'PAID' },
        _sum: { grandTotal: true },
      }),
      prisma.order.aggregate({
        where: { createdAt: { gte: thisMonthStart }, paymentStatus: 'PAID' },
        _sum: { grandTotal: true },
      }),
      prisma.order.count({ where: { status: 'PENDING' } }),
      prisma.product.count({
        where: {
          isActive: true,
          stock: { lte: prisma.product.fields.lowStockThreshold as any },
        },
      }),
      prisma.user.count({ where: { role: 'CUSTOMER' } }),
      this.calculateAbandonmentRate(),
    ]);

    // Get current silver rate
    const silverRateStr = await redis.get('silver:current_rate');
    const currentSilverRate = silverRateStr ? JSON.parse(silverRateStr) : null;

    // Get yesterday's silver rate
    const yesterdayRate = await prisma.silverRateLog.findFirst({
      where: { createdAt: { lt: today, gte: yesterday } },
      orderBy: { createdAt: 'desc' },
    });

    // Top 5 products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      _sum: { quantity: true, totalPrice: true },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 5,
    });

    const topProductDetails = await Promise.all(
      topProducts.map(async (tp) => {
        const product = await prisma.product.findUnique({
          where: { id: tp.productId },
          select: { name: true, sku: true, images: { where: { isPrimary: true }, take: 1 } },
        });
        return {
          productId: tp.productId,
          name: product?.name || '',
          sku: product?.sku || '',
          image: product?.images[0]?.url || '',
          unitsSold: tp._sum.quantity || 0,
          revenue: Number(tp._sum.totalPrice || 0),
        };
      })
    );

    return {
      orders: {
        today: todayOrders,
        thisWeek: weekOrders,
        thisMonth: monthOrders,
        pending: pendingOrders,
      },
      revenue: {
        today: Number(todayRevenue._sum.grandTotal || 0),
        thisWeek: Number(weekRevenue._sum.grandTotal || 0),
        thisMonth: Number(monthRevenue._sum.grandTotal || 0),
      },
      averageOrderValue: monthOrders > 0
        ? Math.round(Number(monthRevenue._sum.grandTotal || 0) / monthOrders)
        : 0,
      customers: totalCustomers,
      lowStockProducts,
      abandonedCartRate,
      silverRate: {
        current: currentSilverRate,
        yesterday: yesterdayRate ? Number(yesterdayRate.effectiveRate) : null,
      },
      topProducts: topProductDetails,
    };
  }

  private async calculateAbandonmentRate(): Promise<string> {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const [totalCarts, abandonedCarts] = await Promise.all([
      prisma.cart.count({ where: { createdAt: { gte: thirtyDaysAgo }, items: { some: {} } } }),
      prisma.abandonedCart.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
    ]);
    return totalCarts > 0 ? ((abandonedCarts / totalCarts) * 100).toFixed(1) : '0';
  }

  async getSalesReport(from: Date, to: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: 'PAID',
      },
      select: {
        createdAt: true,
        grandTotal: true,
        totalGst: true,
        cgst: true,
        sgst: true,
        igst: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    // Group by date
    const dailySales: Record<string, { revenue: number; orders: number; gst: number }> = {};
    for (const order of orders) {
      const date = order.createdAt.toISOString().split('T')[0];
      if (!dailySales[date]) {
        dailySales[date] = { revenue: 0, orders: 0, gst: 0 };
      }
      dailySales[date].revenue += Number(order.grandTotal);
      dailySales[date].orders += 1;
      dailySales[date].gst += Number(order.totalGst);
    }

    return Object.entries(dailySales).map(([date, data]) => ({
      date,
      ...data,
    }));
  }

  async getGSTReport(from: Date, to: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: { gte: from, lte: to },
        paymentStatus: 'PAID',
      },
      select: {
        orderNumber: true,
        createdAt: true,
        taxableAmount: true,
        cgst: true,
        sgst: true,
        igst: true,
        totalGst: true,
        grandTotal: true,
        addressSnapshot: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    return orders.map((o) => ({
      orderNumber: o.orderNumber,
      date: o.createdAt,
      taxableAmount: Number(o.taxableAmount),
      cgst: Number(o.cgst),
      sgst: Number(o.sgst),
      igst: Number(o.igst),
      totalGst: Number(o.totalGst),
      total: Number(o.grandTotal),
      state: (o.addressSnapshot as any)?.state || '',
    }));
  }

  async getInventoryValuation() {
    const silverRateStr = await redis.get('silver:current_rate');
    const silverRate = silverRateStr ? JSON.parse(silverRateStr) : { effectiveRate: 0 };

    const products = await prisma.product.findMany({
      where: { isActive: true, stock: { gt: 0 } },
      select: {
        name: true,
        sku: true,
        stock: true,
        silverWeightGrams: true,
      },
    });

    let totalValue = 0;
    const items = products.map((p) => {
      const silverValue = Number(p.silverWeightGrams) * silverRate.effectiveRate * p.stock;
      totalValue += silverValue;
      return {
        name: p.name,
        sku: p.sku,
        stock: p.stock,
        silverWeightGrams: Number(p.silverWeightGrams),
        estimatedValue: Math.round(silverValue),
      };
    });

    return { items, totalValue: Math.round(totalValue), silverRateUsed: silverRate.effectiveRate };
  }
}

export const dashboardService = new DashboardService();
export default dashboardService;
