import { Decimal } from '@prisma/client/runtime/library';
import prisma from '../../config/database';
import redis from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import { calculateGST, type GSTBreakdown } from '../../utils/gst';
import logger from '../../utils/logger';

const PRICE_LOCK_MINUTES = 60;
const CART_CACHE_TTL = 300; // 5 minutes
const CART_CACHE_PREFIX = 'cart:';

interface CartItemWithPrice {
  id: string;
  productId: string;
  variantId: string | null;
  quantity: number;
  product: {
    id: string;
    name: string;
    slug: string;
    sku: string;
    silverPurity: string;
    silverWeightGrams: Decimal;
    makingChargeType: string;
    makingChargeValue: Decimal;
    additionalCharges: Decimal;
    stock: number;
    isActive: boolean;
    images: { url: string; altText: string | null; isPrimary: boolean }[];
    category: { id: string; name: string; slug: string };
    gemstones: {
      caratWeight: Decimal;
      quantity: number;
      gemstoneRate: { ratePerCarat: Decimal; name: string };
    }[];
  };
  variant: {
    id: string;
    name: string;
    type: string;
    value: string;
    additionalPrice: Decimal;
    stock: number;
    sku: string;
  } | null;
  lockedSilverRate: Decimal | null;
  lockedAt: Date | null;
  // computed
  silverCost?: number;
  gemstoneCost?: number;
  makingCharge?: number;
  additionalCharge?: number;
  unitPrice?: number;
  totalPrice?: number;
  silverRateUsed?: number;
  priceLocked?: boolean;
}

interface CartSummary {
  itemsTotal: number;
  discountAmount: number;
  couponCode: string | null;
  shippingCost: number;
  gst: GSTBreakdown;
  grandTotal: number;
  itemCount: number;
  items: CartItemWithPrice[];
}

export class CartService {
  /**
   * Get or create a cart for a user or session
   */
  async getOrCreateCart(userId?: string, sessionId?: string): Promise<string> {
    if (!userId && !sessionId) {
      throw new AppError('Either userId or sessionId is required', 400);
    }

    // Try to find existing cart
    const where = userId ? { userId } : { sessionId };
    let cart = await prisma.cart.findFirst({
      where: { ...where, isAbandoned: false },
      orderBy: { createdAt: 'desc' },
    });

    if (cart) {
      // If user just logged in, merge session cart into user cart
      if (userId && sessionId) {
        const sessionCart = await prisma.cart.findFirst({
          where: { sessionId, isAbandoned: false, userId: null },
          include: { items: true },
        });

        if (sessionCart && sessionCart.id !== cart.id && sessionCart.items.length > 0) {
          await this.mergeCarts(sessionCart.id, cart.id);
          await prisma.cart.delete({ where: { id: sessionCart.id } });
        }
      }
      return cart.id;
    }

    // Create new cart
    cart = await prisma.cart.create({
      data: {
        userId: userId || null,
        sessionId: sessionId || null,
      },
    });

    return cart.id;
  }

  /**
   * Merge items from source cart into target cart
   */
  private async mergeCarts(sourceCartId: string, targetCartId: string): Promise<void> {
    const sourceItems = await prisma.cartItem.findMany({
      where: { cartId: sourceCartId },
    });

    const targetItems = await prisma.cartItem.findMany({
      where: { cartId: targetCartId },
    });

    for (const sourceItem of sourceItems) {
      const existingItem = targetItems.find(
        (ti) =>
          ti.productId === sourceItem.productId &&
          ti.variantId === sourceItem.variantId
      );

      if (existingItem) {
        await prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + sourceItem.quantity },
        });
      } else {
        await prisma.cartItem.create({
          data: {
            cartId: targetCartId,
            productId: sourceItem.productId,
            variantId: sourceItem.variantId,
            quantity: sourceItem.quantity,
            lockedSilverRate: sourceItem.lockedSilverRate,
            lockedAt: sourceItem.lockedAt,
          },
        });
      }
    }
  }

  /**
   * Get cart with items and computed prices
   */
  async getCart(cartId: string): Promise<{ cart: any; items: CartItemWithPrice[] }> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: {
                  where: { isPrimary: true },
                  take: 1,
                },
                category: {
                  select: { id: true, name: true, slug: true },
                },
                gemstones: {
                  include: {
                    gemstoneRate: {
                      select: { ratePerCarat: true, name: true },
                    },
                  },
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    const currentSilverRate = await this.getCurrentSilverRate();
    const items = cart.items.map((item) =>
      this.computeItemPrice(item as unknown as CartItemWithPrice, currentSilverRate)
    );

    return { cart, items };
  }

  /**
   * Add an item to the cart
   */
  async addItem(
    cartId: string,
    productId: string,
    variantId?: string,
    quantity: number = 1
  ): Promise<CartItemWithPrice> {
    // Validate product exists and is active
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        variants: variantId ? { where: { id: variantId } } : false,
        images: { where: { isPrimary: true }, take: 1 },
        category: { select: { id: true, name: true, slug: true } },
        gemstones: {
          include: {
            gemstoneRate: { select: { ratePerCarat: true, name: true } },
          },
        },
      },
    });

    if (!product || !product.isActive) {
      throw new AppError('Product not found or is inactive', 404);
    }

    // Check stock
    if (variantId) {
      const variant = (product as any).variants?.[0];
      if (!variant) {
        throw new AppError('Product variant not found', 404);
      }
      if (!variant.isActive) {
        throw new AppError('Product variant is inactive', 400);
      }
      if (variant.stock < quantity) {
        throw new AppError(`Only ${variant.stock} items available`, 400);
      }
    } else {
      if (product.stock < quantity) {
        throw new AppError(`Only ${product.stock} items available`, 400);
      }
    }

    // Check if item already in cart
    const existingItem = await prisma.cartItem.findFirst({
      where: {
        cartId,
        productId,
        variantId: variantId || null,
      },
    });

    const currentSilverRate = await this.getCurrentSilverRate();
    const priceLockExpiry = new Date(Date.now() + PRICE_LOCK_MINUTES * 60 * 1000);

    let cartItem;
    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;
      const stockAvailable = variantId
        ? (product as any).variants[0].stock
        : product.stock;

      if (newQuantity > stockAvailable) {
        throw new AppError(`Only ${stockAvailable} items available`, 400);
      }

      cartItem = await prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: newQuantity,
          lockedSilverRate: currentSilverRate,
          lockedAt: new Date(),
        },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              category: { select: { id: true, name: true, slug: true } },
              gemstones: {
                include: {
                  gemstoneRate: { select: { ratePerCarat: true, name: true } },
                },
              },
            },
          },
          variant: true,
        },
      });
    } else {
      cartItem = await prisma.cartItem.create({
        data: {
          cartId,
          productId,
          variantId: variantId || null,
          quantity,
          lockedSilverRate: currentSilverRate,
          lockedAt: new Date(),
        },
        include: {
          product: {
            include: {
              images: { where: { isPrimary: true }, take: 1 },
              category: { select: { id: true, name: true, slug: true } },
              gemstones: {
                include: {
                  gemstoneRate: { select: { ratePerCarat: true, name: true } },
                },
              },
            },
          },
          variant: true,
        },
      });
    }

    // Update cart price lock expiry
    await prisma.cart.update({
      where: { id: cartId },
      data: { priceLockExpiresAt: priceLockExpiry },
    });

    await this.invalidateCartCache(cartId);

    return this.computeItemPrice(
      cartItem as unknown as CartItemWithPrice,
      currentSilverRate
    );
  }

  /**
   * Update quantity of a cart item
   */
  async updateItemQuantity(
    cartId: string,
    itemId: string,
    quantity: number
  ): Promise<CartItemWithPrice> {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
      include: {
        product: true,
        variant: true,
      },
    });

    if (!item) {
      throw new AppError('Cart item not found', 404);
    }

    // Check stock
    const stockAvailable = item.variant ? item.variant.stock : item.product.stock;
    if (quantity > stockAvailable) {
      throw new AppError(`Only ${stockAvailable} items available`, 400);
    }

    const updatedItem = await prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { id: true, name: true, slug: true } },
            gemstones: {
              include: {
                gemstoneRate: { select: { ratePerCarat: true, name: true } },
              },
            },
          },
        },
        variant: true,
      },
    });

    await this.invalidateCartCache(cartId);

    const currentSilverRate = await this.getCurrentSilverRate();
    return this.computeItemPrice(
      updatedItem as unknown as CartItemWithPrice,
      currentSilverRate
    );
  }

  /**
   * Remove an item from the cart
   */
  async removeItem(cartId: string, itemId: string): Promise<void> {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });

    if (!item) {
      throw new AppError('Cart item not found', 404);
    }

    await prisma.cartItem.delete({ where: { id: itemId } });
    await this.invalidateCartCache(cartId);
  }

  /**
   * Clear all items from the cart
   */
  async clearCart(cartId: string): Promise<void> {
    await prisma.cartItem.deleteMany({ where: { cartId } });

    await prisma.cart.update({
      where: { id: cartId },
      data: { priceLockExpiresAt: null },
    });

    await this.invalidateCartCache(cartId);
  }

  /**
   * Apply a coupon code to the cart
   */
  async applyCoupon(
    cartId: string,
    code: string,
    userId?: string
  ): Promise<{ discount: number; coupon: any }> {
    const coupon = await prisma.coupon.findUnique({ where: { code } });

    if (!coupon) {
      throw new AppError('Invalid coupon code', 404);
    }

    // Check if coupon is active
    if (!coupon.isActive) {
      throw new AppError('This coupon is no longer active', 400);
    }

    // Check date validity
    const now = new Date();
    if (now < coupon.startsAt) {
      throw new AppError('This coupon is not yet active', 400);
    }
    if (now > coupon.expiresAt) {
      throw new AppError('This coupon has expired', 400);
    }

    // Check usage limit
    if (coupon.usageLimit !== null && coupon.usedCount >= coupon.usageLimit) {
      throw new AppError('This coupon has reached its usage limit', 400);
    }

    // Check per-customer limit
    if (userId) {
      const userUsageCount = await prisma.couponUsage.count({
        where: { couponId: coupon.id, userId },
      });

      if (userUsageCount >= coupon.perCustomerLimit) {
        throw new AppError('You have already used this coupon the maximum number of times', 400);
      }

      // Check first-order-only
      if (coupon.isFirstOrderOnly) {
        const orderCount = await prisma.order.count({ where: { userId } });
        if (orderCount > 0) {
          throw new AppError('This coupon is valid for first orders only', 400);
        }
      }
    }

    // Check minimum cart value
    const { items } = await this.getCart(cartId);
    const itemsTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);

    if (coupon.minimumCartValue && itemsTotal < Number(coupon.minimumCartValue)) {
      throw new AppError(
        `Minimum cart value of ₹${coupon.minimumCartValue} is required for this coupon`,
        400
      );
    }

    // Check applicable categories
    if (coupon.applicableCategories.length > 0) {
      const cartCategoryIds = items.map((item) => item.product.category.id);
      const hasApplicableItem = cartCategoryIds.some((catId) =>
        coupon.applicableCategories.includes(catId)
      );
      if (!hasApplicableItem) {
        throw new AppError('This coupon is not applicable to items in your cart', 400);
      }
    }

    // Calculate discount
    let applicableAmount = itemsTotal;
    if (coupon.applicableCategories.length > 0) {
      applicableAmount = items
        .filter((item) => coupon.applicableCategories.includes(item.product.category.id))
        .reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    }

    let discount: number;
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round(applicableAmount * Number(coupon.discountValue) / 100);
      if (coupon.maximumDiscount) {
        discount = Math.min(discount, Number(coupon.maximumDiscount));
      }
    } else {
      discount = Number(coupon.discountValue);
    }

    // Discount should not exceed the applicable amount
    discount = Math.min(discount, applicableAmount);

    // Store coupon on cart in Redis for checkout
    await redis.set(
      `${CART_CACHE_PREFIX}${cartId}:coupon`,
      JSON.stringify({ couponId: coupon.id, code: coupon.code, discount }),
      'EX',
      3600 // 1 hour
    );

    await this.invalidateCartCache(cartId);

    return {
      discount,
      coupon: {
        code: coupon.code,
        description: coupon.description,
        discountType: coupon.discountType,
        discountValue: Number(coupon.discountValue),
        maximumDiscount: coupon.maximumDiscount ? Number(coupon.maximumDiscount) : null,
      },
    };
  }

  /**
   * Remove coupon from the cart
   */
  async removeCoupon(cartId: string): Promise<void> {
    await redis.del(`${CART_CACHE_PREFIX}${cartId}:coupon`);
    await this.invalidateCartCache(cartId);
  }

  /**
   * Get full cart summary with pricing breakdown
   */
  async getCartSummary(cartId: string, state?: string): Promise<CartSummary> {
    const { items } = await this.getCart(cartId);

    const itemsTotal = items.reduce((sum, item) => sum + (item.totalPrice || 0), 0);
    const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

    // Get coupon discount
    let discountAmount = 0;
    let couponCode: string | null = null;
    const couponData = await redis.get(`${CART_CACHE_PREFIX}${cartId}:coupon`);
    if (couponData) {
      const parsed = JSON.parse(couponData);
      discountAmount = parsed.discount;
      couponCode = parsed.code;
    }

    // Shipping cost (free above threshold, e.g., ₹999)
    const SHIPPING_THRESHOLD = 999;
    const SHIPPING_COST = 99;
    const subtotalAfterDiscount = itemsTotal - discountAmount;
    const shippingCost = subtotalAfterDiscount >= SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;

    // GST calculation
    const taxableAmount = subtotalAfterDiscount + shippingCost;
    const buyerState = state || 'Rajasthan'; // default to same-state
    const gst = calculateGST(taxableAmount, buyerState);

    const grandTotal = Math.round((taxableAmount + gst.totalGst) * 100) / 100;

    return {
      itemsTotal: Math.round(itemsTotal * 100) / 100,
      discountAmount,
      couponCode,
      shippingCost,
      gst,
      grandTotal,
      itemCount,
      items,
    };
  }

  /**
   * Check if price lock has expired and recalculate if needed
   */
  async checkPriceLock(
    cartId: string
  ): Promise<{ expired: boolean; priceChanged: boolean; items: CartItemWithPrice[] }> {
    const cart = await prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        items: {
          include: {
            product: {
              include: {
                images: { where: { isPrimary: true }, take: 1 },
                category: { select: { id: true, name: true, slug: true } },
                gemstones: {
                  include: {
                    gemstoneRate: { select: { ratePerCarat: true, name: true } },
                  },
                },
              },
            },
            variant: true,
          },
        },
      },
    });

    if (!cart) {
      throw new AppError('Cart not found', 404);
    }

    const now = new Date();
    const expired = cart.priceLockExpiresAt ? now > cart.priceLockExpiresAt : true;

    if (!expired) {
      const currentSilverRate = await this.getCurrentSilverRate();
      const items = cart.items.map((item) =>
        this.computeItemPrice(item as unknown as CartItemWithPrice, currentSilverRate)
      );
      return { expired: false, priceChanged: false, items };
    }

    // Lock expired - recalculate with current rates
    const currentSilverRate = await this.getCurrentSilverRate();
    let priceChanged = false;

    const items: CartItemWithPrice[] = [];
    for (const item of cart.items) {
      const oldLockedRate = item.lockedSilverRate ? Number(item.lockedSilverRate) : null;

      if (oldLockedRate !== null && oldLockedRate !== currentSilverRate) {
        priceChanged = true;
      }

      // Update locked rate
      await prisma.cartItem.update({
        where: { id: item.id },
        data: {
          lockedSilverRate: currentSilverRate,
          lockedAt: new Date(),
        },
      });

      const computedItem = this.computeItemPrice(
        item as unknown as CartItemWithPrice,
        currentSilverRate
      );
      items.push(computedItem);
    }

    // Update cart lock expiry
    await prisma.cart.update({
      where: { id: cartId },
      data: {
        priceLockExpiresAt: new Date(Date.now() + PRICE_LOCK_MINUTES * 60 * 1000),
      },
    });

    await this.invalidateCartCache(cartId);

    return { expired: true, priceChanged, items };
  }

  /**
   * Move a cart item to the user's wishlist
   */
  async saveForLater(cartId: string, itemId: string, userId: string): Promise<void> {
    const item = await prisma.cartItem.findFirst({
      where: { id: itemId, cartId },
    });

    if (!item) {
      throw new AppError('Cart item not found', 404);
    }

    // Add to wishlist (upsert to avoid duplicates)
    await prisma.wishlist.upsert({
      where: {
        userId_productId: {
          userId,
          productId: item.productId,
        },
      },
      create: {
        userId,
        productId: item.productId,
      },
      update: {},
    });

    // Remove from cart
    await prisma.cartItem.delete({ where: { id: itemId } });
    await this.invalidateCartCache(cartId);
  }

  // ─── Private Helpers ──────────────────────────────────

  /**
   * Compute item price based on silver rate and product attributes
   */
  private computeItemPrice(
    item: CartItemWithPrice,
    currentSilverRate: number
  ): CartItemWithPrice {
    const product = item.product;
    const silverWeight = Number(product.silverWeightGrams);

    // Use locked rate if still valid, otherwise current rate
    const silverRate =
      item.lockedSilverRate !== null ? Number(item.lockedSilverRate) : currentSilverRate;

    // Silver cost
    const silverCost = Math.round(silverWeight * silverRate * 100) / 100;

    // Gemstone cost
    let gemstoneCost = 0;
    if (product.gemstones && product.gemstones.length > 0) {
      for (const gem of product.gemstones) {
        gemstoneCost +=
          Number(gem.caratWeight) * gem.quantity * Number(gem.gemstoneRate.ratePerCarat);
      }
    }
    gemstoneCost = Math.round(gemstoneCost * 100) / 100;

    // Making charge
    let makingCharge = 0;
    const makingChargeValue = Number(product.makingChargeValue);
    switch (product.makingChargeType) {
      case 'FLAT':
        makingCharge = makingChargeValue;
        break;
      case 'PERCENTAGE':
        makingCharge = Math.round(silverCost * makingChargeValue / 100 * 100) / 100;
        break;
      case 'PER_GRAM':
        makingCharge = Math.round(silverWeight * makingChargeValue * 100) / 100;
        break;
    }

    // Additional charges
    let additionalCharge = Number(product.additionalCharges);
    if (item.variant) {
      additionalCharge += Number(item.variant.additionalPrice);
    }

    const unitPrice =
      Math.round((silverCost + gemstoneCost + makingCharge + additionalCharge) * 100) / 100;
    const totalPrice = Math.round(unitPrice * item.quantity * 100) / 100;

    return {
      ...item,
      silverCost,
      gemstoneCost,
      makingCharge,
      additionalCharge,
      unitPrice,
      totalPrice,
      silverRateUsed: silverRate,
      priceLocked: item.lockedSilverRate !== null,
    };
  }

  /**
   * Get the current effective silver rate from the latest log
   */
  private async getCurrentSilverRate(): Promise<number> {
    // Try cache first
    const cached = await redis.get('current_silver_rate');
    if (cached) {
      return parseFloat(cached);
    }

    const latestRate = await prisma.silverRateLog.findFirst({
      orderBy: { createdAt: 'desc' },
    });

    if (!latestRate) {
      throw new AppError('Silver rate not available. Please try again later.', 503);
    }

    const rate = Number(latestRate.effectiveRate);
    await redis.set('current_silver_rate', rate.toString(), 'EX', 300);

    return rate;
  }

  /**
   * Invalidate cart cache in Redis
   */
  private async invalidateCartCache(cartId: string): Promise<void> {
    await redis.del(`${CART_CACHE_PREFIX}${cartId}`);
  }
}

export const cartService = new CartService();
