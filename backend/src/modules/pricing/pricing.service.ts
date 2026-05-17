import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database';
import redis from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import type {
  SilverRateOverrideInput,
  GemstoneRateInput,
  UpdateGemstoneRateInput,
  MakingChargeRuleInput,
} from './pricing.schema';

// ─────────────────────────────────────────────
// Helper: convert Prisma Decimal to number
// ─────────────────────────────────────────────
function toNum(val: Decimal | number | null | undefined): number {
  if (val === null || val === undefined) return 0;
  return typeof val === 'number' ? val : Number(val);
}

function roundTwo(val: number): number {
  return Math.round(val * 100) / 100;
}

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SilverRateInfo {
  ratePerGram: number;
  ratePerKg: number;
  effectiveRate: number;
  bufferPercent: number;
  source: string;
  updatedAt: Date;
}

export interface PriceBreakdown {
  silverCost: number;
  gemstoneCost: number;
  makingCharge: number;
  makingChargeType: string;
  additionalCharges: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  total: number;
  silverRateUsed: number;
  silverWeightGrams: number;
  gemstoneDetails: Array<{
    name: string;
    caratWeight: number;
    quantity: number;
    ratePerCarat: number;
    cost: number;
  }>;
}

export interface CartItemPriceResult {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: PriceBreakdown;
  lineTotal: number;
}

// ─────────────────────────────────────────────
// Redis keys
// ─────────────────────────────────────────────
const REDIS_SILVER_RATE_KEY = 'silver:current_rate';
const REDIS_SILVER_RATE_TTL = 60 * 60; // 1 hour

// ─────────────────────────────────────────────
// Service
// ─────────────────────────────────────────────

export class PricingService {
  // ═══════════════════════════════════════════
  // SILVER RATE
  // ═══════════════════════════════════════════

  async getCurrentSilverRate(): Promise<SilverRateInfo> {
    // 1. Try Redis cache first
    try {
      const cached = await redis.get(REDIS_SILVER_RATE_KEY);
      if (cached) {
        return JSON.parse(cached);
      }
    } catch {
      // Redis miss or error, fall through to DB
    }

    // 2. Fallback: latest SilverRateLog from DB
    const latest = await prisma.silverRateLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latest) {
      throw new AppError('No silver rate configured. Please set a silver rate first.', 404);
    }

    const bufferPercent = await this.getBufferPercent();
    const ratePerGram = toNum(latest.ratePerGram);
    const effectiveRate = roundTwo(ratePerGram * (1 + bufferPercent / 100));

    const info: SilverRateInfo = {
      ratePerGram,
      ratePerKg: toNum(latest.ratePerKg),
      effectiveRate,
      bufferPercent,
      source: latest.source,
      updatedAt: latest.createdAt,
    };

    // Cache it
    try {
      await redis.set(REDIS_SILVER_RATE_KEY, JSON.stringify(info), 'EX', REDIS_SILVER_RATE_TTL);
    } catch {
      // Non-critical: cache write failed
    }

    return info;
  }

  async setSilverRateManual(
    ratePerGram: number,
    ratePerKg: number,
    adminId: string,
    note?: string
  ): Promise<SilverRateInfo> {
    const bufferPercent = await this.getBufferPercent();
    const effectiveRate = roundTwo(ratePerGram * (1 + bufferPercent / 100));

    const log = await prisma.silverRateLog.create({
      data: {
        ratePerGram: new Decimal(ratePerGram),
        ratePerKg: new Decimal(ratePerKg),
        source: 'MANUAL',
        bufferPercent: new Decimal(bufferPercent),
        effectiveRate: new Decimal(effectiveRate),
        apiResponse: note ? { note, adminId } : { adminId },
      },
    });

    const info: SilverRateInfo = {
      ratePerGram: toNum(log.ratePerGram),
      ratePerKg: toNum(log.ratePerKg),
      effectiveRate: toNum(log.effectiveRate),
      bufferPercent,
      source: log.source,
      updatedAt: log.createdAt,
    };

    // Update Redis cache
    try {
      await redis.set(REDIS_SILVER_RATE_KEY, JSON.stringify(info), 'EX', REDIS_SILVER_RATE_TTL);
    } catch {
      // Non-critical
    }

    return info;
  }

  async getSilverRateHistory(days: number = 30) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const logs = await prisma.silverRateLog.findMany({
      where: { createdAt: { gte: since } },
      orderBy: { createdAt: 'desc' },
    });

    return logs.map((log) => ({
      id: log.id,
      ratePerGram: toNum(log.ratePerGram),
      ratePerKg: toNum(log.ratePerKg),
      effectiveRate: toNum(log.effectiveRate),
      bufferPercent: toNum(log.bufferPercent),
      source: log.source,
      createdAt: log.createdAt,
    }));
  }

  // ═══════════════════════════════════════════
  // BUFFER PERCENT
  // ═══════════════════════════════════════════

  private async getBufferPercent(): Promise<number> {
    const setting = await prisma.setting.findUnique({
      where: { key: 'silver_buffer_percent' },
    });

    if (!setting) return 0;
    const val = setting.value as { percent?: number };
    return val.percent ?? 0;
  }

  async setBufferPercent(percent: number): Promise<{ percent: number; effectiveRate: number }> {
    await prisma.setting.upsert({
      where: { key: 'silver_buffer_percent' },
      update: {
        value: { percent },
        description: 'Buffer percentage added on top of raw silver rate',
      },
      create: {
        key: 'silver_buffer_percent',
        value: { percent },
        description: 'Buffer percentage added on top of raw silver rate',
      },
    });

    // Invalidate cached silver rate so next fetch recalculates
    try {
      await redis.del(REDIS_SILVER_RATE_KEY);
    } catch {
      // Non-critical
    }

    // Recalculate effective rate from latest log
    const latest = await prisma.silverRateLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    const ratePerGram = latest ? toNum(latest.ratePerGram) : 0;
    const effectiveRate = roundTwo(ratePerGram * (1 + percent / 100));

    return { percent, effectiveRate };
  }

  // ═══════════════════════════════════════════
  // GEMSTONE RATES
  // ═══════════════════════════════════════════

  async getGemstoneRates() {
    return prisma.gemstoneRateMaster.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { qualityGrade: 'asc' }],
    });
  }

  async createGemstoneRate(data: GemstoneRateInput) {
    return prisma.gemstoneRateMaster.create({
      data: {
        name: data.name,
        type: data.type,
        qualityGrade: data.qualityGrade,
        ratePerCarat: new Decimal(data.ratePerCarat),
        effectiveFrom: new Date(data.effectiveFrom),
      },
    });
  }

  async updateGemstoneRate(id: string, data: UpdateGemstoneRateInput) {
    const existing = await prisma.gemstoneRateMaster.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Gemstone rate not found', 404);
    }

    return prisma.gemstoneRateMaster.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.qualityGrade !== undefined && { qualityGrade: data.qualityGrade }),
        ...(data.ratePerCarat !== undefined && { ratePerCarat: new Decimal(data.ratePerCarat) }),
        ...(data.effectiveFrom !== undefined && { effectiveFrom: new Date(data.effectiveFrom) }),
      },
    });
  }

  async deleteGemstoneRate(id: string) {
    const existing = await prisma.gemstoneRateMaster.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Gemstone rate not found', 404);
    }

    return prisma.gemstoneRateMaster.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ═══════════════════════════════════════════
  // MAKING CHARGE RULES
  // ═══════════════════════════════════════════

  async getMakingChargeRules() {
    return prisma.makingChargeRule.findMany({
      where: { isActive: true },
      orderBy: [{ scope: 'asc' }, { createdAt: 'desc' }],
    });
  }

  async createMakingChargeRule(data: MakingChargeRuleInput) {
    return prisma.makingChargeRule.create({
      data: {
        name: data.name,
        type: data.type,
        value: new Decimal(data.value),
        scope: data.scope,
        categoryId: data.categoryId ?? null,
        productId: data.productId ?? null,
      },
    });
  }

  async updateMakingChargeRule(id: string, data: Partial<MakingChargeRuleInput>) {
    const existing = await prisma.makingChargeRule.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Making charge rule not found', 404);
    }

    return prisma.makingChargeRule.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.type !== undefined && { type: data.type }),
        ...(data.value !== undefined && { value: new Decimal(data.value) }),
        ...(data.scope !== undefined && { scope: data.scope }),
        ...(data.categoryId !== undefined && { categoryId: data.categoryId }),
        ...(data.productId !== undefined && { productId: data.productId }),
      },
    });
  }

  async deleteMakingChargeRule(id: string) {
    const existing = await prisma.makingChargeRule.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Making charge rule not found', 404);
    }

    return prisma.makingChargeRule.update({
      where: { id },
      data: { isActive: false },
    });
  }

  // ═══════════════════════════════════════════
  // PRICE CALCULATION - THE KEY METHOD
  // ═══════════════════════════════════════════

  async calculateProductPrice(
    product: {
      id: string;
      silverWeightGrams: Decimal | number;
      makingChargeType: string;
      makingChargeValue: Decimal | number;
      additionalCharges: Decimal | number;
      categoryId: string;
      gemstones?: Array<{
        caratWeight: Decimal | number;
        quantity: number;
        gemstoneRate: {
          name?: string;
          ratePerCarat: Decimal | number;
        };
      }>;
    },
    silverRate?: SilverRateInfo
  ): Promise<PriceBreakdown> {
    // 1. Get current silver rate if not provided
    const rate = silverRate ?? (await this.getCurrentSilverRate());

    // 2. Silver cost
    const silverWeightGrams = toNum(product.silverWeightGrams);
    const silverCost = roundTwo(silverWeightGrams * rate.effectiveRate);

    // 3. Gemstone cost
    const gemstoneDetails: PriceBreakdown['gemstoneDetails'] = [];
    let gemstoneCost = 0;

    if (product.gemstones && product.gemstones.length > 0) {
      for (const gem of product.gemstones) {
        const caratWeight = toNum(gem.caratWeight);
        const ratePerCarat = toNum(gem.gemstoneRate.ratePerCarat);
        const quantity = gem.quantity;
        const cost = roundTwo(caratWeight * ratePerCarat * quantity);

        gemstoneDetails.push({
          name: gem.gemstoneRate.name ?? 'Unknown',
          caratWeight,
          quantity,
          ratePerCarat,
          cost,
        });

        gemstoneCost += cost;
      }
      gemstoneCost = roundTwo(gemstoneCost);
    }

    // 4. Making charge - resolution order: product-level override > category rule > global default
    const makingCharge = await this.resolveMakingCharge(product, silverCost);

    // 5. Additional charges
    const additionalCharges = toNum(product.additionalCharges);

    // 6. Subtotal
    const subtotal = roundTwo(silverCost + gemstoneCost + makingCharge.amount + additionalCharges);

    // 7. GST (3% for jewellery)
    const totalGst = roundTwo(subtotal * 0.03);
    const cgst = roundTwo(totalGst / 2);
    const sgst = roundTwo(totalGst - cgst); // avoid rounding errors

    // 8. Total
    const total = roundTwo(subtotal + totalGst);

    return {
      silverCost,
      gemstoneCost,
      makingCharge: makingCharge.amount,
      makingChargeType: makingCharge.type,
      additionalCharges,
      subtotal,
      cgst,
      sgst,
      totalGst,
      total,
      silverRateUsed: rate.effectiveRate,
      silverWeightGrams,
      gemstoneDetails,
    };
  }

  private async resolveMakingCharge(
    product: {
      id: string;
      silverWeightGrams: Decimal | number;
      makingChargeType: string;
      makingChargeValue: Decimal | number;
      categoryId: string;
    },
    silverCost: number
  ): Promise<{ amount: number; type: string }> {
    const silverWeight = toNum(product.silverWeightGrams);
    const productMakingValue = toNum(product.makingChargeValue);

    // Product-level override (from the product model itself)
    if (productMakingValue > 0) {
      const amount = this.applyMakingCharge(
        product.makingChargeType,
        productMakingValue,
        silverCost,
        silverWeight
      );
      return { amount, type: product.makingChargeType };
    }

    // Product-scope rule from MakingChargeRule table
    const productRule = await prisma.makingChargeRule.findFirst({
      where: { scope: 'PRODUCT', productId: product.id, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (productRule) {
      const amount = this.applyMakingCharge(
        productRule.type,
        toNum(productRule.value),
        silverCost,
        silverWeight
      );
      return { amount, type: productRule.type };
    }

    // Category-scope rule
    const categoryRule = await prisma.makingChargeRule.findFirst({
      where: { scope: 'CATEGORY', categoryId: product.categoryId, isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (categoryRule) {
      const amount = this.applyMakingCharge(
        categoryRule.type,
        toNum(categoryRule.value),
        silverCost,
        silverWeight
      );
      return { amount, type: categoryRule.type };
    }

    // Global default rule
    const globalRule = await prisma.makingChargeRule.findFirst({
      where: { scope: 'GLOBAL', isActive: true },
      orderBy: { createdAt: 'desc' },
    });

    if (globalRule) {
      const amount = this.applyMakingCharge(
        globalRule.type,
        toNum(globalRule.value),
        silverCost,
        silverWeight
      );
      return { amount, type: globalRule.type };
    }

    // No rule found at all
    return { amount: 0, type: 'NONE' };
  }

  private applyMakingCharge(
    type: string,
    value: number,
    silverCost: number,
    silverWeightGrams: number
  ): number {
    switch (type) {
      case 'FLAT':
        return roundTwo(value);
      case 'PERCENTAGE':
        return roundTwo(silverCost * value / 100);
      case 'PER_GRAM':
        return roundTwo(silverWeightGrams * value);
      default:
        return 0;
    }
  }

  // ═══════════════════════════════════════════
  // SIMULATE PRICE (Admin Sandbox)
  // ═══════════════════════════════════════════

  async simulatePrice(
    silverRatePerGram: number,
    productId?: string
  ): Promise<PriceBreakdown | PriceBreakdown[]> {
    const bufferPercent = await this.getBufferPercent();
    const simulatedRate: SilverRateInfo = {
      ratePerGram: silverRatePerGram,
      ratePerKg: silverRatePerGram * 1000,
      effectiveRate: roundTwo(silverRatePerGram * (1 + bufferPercent / 100)),
      bufferPercent,
      source: 'SIMULATION',
      updatedAt: new Date(),
    };

    if (productId) {
      const product = await this.fetchProductForPricing(productId);
      return this.calculateProductPrice(product, simulatedRate);
    }

    // If no productId, simulate for a few featured / active products
    const products = await prisma.product.findMany({
      where: { isActive: true },
      take: 10,
      include: {
        gemstones: {
          include: { gemstoneRate: true },
        },
      },
    });

    const results: PriceBreakdown[] = [];
    for (const product of products) {
      const breakdown = await this.calculateProductPrice(product, simulatedRate);
      results.push(breakdown);
    }

    return results;
  }

  // ═══════════════════════════════════════════
  // CALCULATE CART TOTAL
  // ═══════════════════════════════════════════

  async calculateCartTotal(
    cartItems: Array<{ productId: string; quantity: number }>,
    silverRate?: SilverRateInfo
  ): Promise<{
    items: CartItemPriceResult[];
    cartSubtotal: number;
    cartGst: number;
    cartTotal: number;
    silverRateUsed: number;
  }> {
    const rate = silverRate ?? (await this.getCurrentSilverRate());
    const items: CartItemPriceResult[] = [];
    let cartSubtotal = 0;
    let cartGst = 0;
    let cartTotal = 0;

    for (const cartItem of cartItems) {
      const product = await this.fetchProductForPricing(cartItem.productId);
      const unitPrice = await this.calculateProductPrice(product, rate);
      const lineTotal = roundTwo(unitPrice.total * cartItem.quantity);

      items.push({
        productId: product.id,
        productName: product.name,
        quantity: cartItem.quantity,
        unitPrice,
        lineTotal,
      });

      cartSubtotal += roundTwo(unitPrice.subtotal * cartItem.quantity);
      cartGst += roundTwo(unitPrice.totalGst * cartItem.quantity);
      cartTotal += lineTotal;
    }

    return {
      items,
      cartSubtotal: roundTwo(cartSubtotal),
      cartGst: roundTwo(cartGst),
      cartTotal: roundTwo(cartTotal),
      silverRateUsed: rate.effectiveRate,
    };
  }

  // ═══════════════════════════════════════════
  // CALCULATE SINGLE PRODUCT BY ID (public)
  // ═══════════════════════════════════════════

  async calculateProductPriceById(productId: string): Promise<PriceBreakdown> {
    const product = await this.fetchProductForPricing(productId);
    return this.calculateProductPrice(product);
  }

  // ═══════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════

  private async fetchProductForPricing(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        gemstones: {
          include: {
            gemstoneRate: true,
          },
        },
      },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    if (!product.isActive) {
      throw new AppError('Product is not active', 400);
    }

    return product;
  }
}

export const pricingService = new PricingService();
