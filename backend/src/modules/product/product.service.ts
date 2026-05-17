import { Prisma } from '@prisma/client';
import prisma from '../../config/database';
import redis from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import { getPaginationArgs } from '../../utils/pagination';
import { PricingService } from '../pricing/pricing.service';
import type {
  CreateProductInput,
  UpdateProductInput,
  ProductQueryInput,
} from './product.schema';

const pricingService = new PricingService();

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Standard includes for product queries
const productIncludes = {
  category: {
    select: { id: true, name: true, slug: true, type: true },
  },
  images: {
    orderBy: [{ isPrimary: 'desc' as const }, { sortOrder: 'asc' as const }],
  },
  gemstones: {
    include: {
      gemstoneRate: true,
    },
  },
  variants: {
    where: { isActive: true },
    orderBy: { name: 'asc' as const },
  },
};

async function attachPrice(product: Record<string, unknown>) {
  try {
    const pricing = await pricingService.calculateProductPrice(product as never);
    return { ...product, pricing };
  } catch {
    // If pricing fails (e.g., no silver rate configured), still return the product
    return { ...product, pricing: null };
  }
}

async function attachPrices(products: Record<string, unknown>[]) {
  return Promise.all(products.map((p) => attachPrice(p)));
}

export class ProductService {
  async getAll(query: ProductQueryInput) {
    const { page, limit, sortBy, sortOrder } = query;
    const paginationArgs = getPaginationArgs({ page, limit, sortBy, sortOrder });

    const where: Prisma.ProductWhereInput = { isActive: true };

    if (query.categoryId) {
      where.categoryId = query.categoryId;
    }

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { sku: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
        { tags: { has: query.search } },
      ];
    }

    if (query.silverPurity) {
      where.silverPurity = query.silverPurity;
    }

    if (query.isFeatured !== undefined) {
      where.isFeatured = query.isFeatured;
    }

    if (query.isBestseller !== undefined) {
      where.isBestseller = query.isBestseller;
    }

    if (query.isNewArrival !== undefined) {
      where.isNewArrival = query.isNewArrival;
    }

    if (query.tags && query.tags.length > 0) {
      where.tags = { hasEvery: query.tags };
    }

    if (query.gemstoneType) {
      where.gemstones = {
        some: {
          gemstoneRate: {
            type: query.gemstoneType,
          },
        },
      };
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: productIncludes,
        ...paginationArgs,
      }),
      prisma.product.count({ where }),
    ]);

    const productsWithPrices = await attachPrices(
      products as unknown as Record<string, unknown>[]
    );

    // Post-filter by price range if specified
    let filtered = productsWithPrices;
    if (query.minPrice !== undefined || query.maxPrice !== undefined) {
      filtered = productsWithPrices.filter((p) => {
        const pricing = p.pricing as Record<string, unknown> | null;
        if (!pricing || !pricing.totalPrice) return false;
        const totalPrice = Number(pricing.totalPrice);
        if (query.minPrice !== undefined && totalPrice < query.minPrice) return false;
        if (query.maxPrice !== undefined && totalPrice > query.maxPrice) return false;
        return true;
      });
    }

    return { products: filtered, total, page, limit };
  }

  async getBySlug(slug: string) {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: productIncludes,
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return attachPrice(product as unknown as Record<string, unknown>);
  }

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: productIncludes,
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    return attachPrice(product as unknown as Record<string, unknown>);
  }

  async create(data: CreateProductInput) {
    const slug = data.slug || slugify(data.name);

    // Check slug uniqueness
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new AppError('A product with this slug already exists', 409);
    }

    // Check SKU uniqueness
    const existingSku = await prisma.product.findUnique({
      where: { sku: data.sku },
    });
    if (existingSku) {
      throw new AppError('A product with this SKU already exists', 409);
    }

    // Validate category exists
    const category = await prisma.category.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      throw new AppError('Category not found', 404);
    }

    // Validate gemstone rate IDs if provided
    if (data.gemstones && data.gemstones.length > 0) {
      const gemstoneRateIds = data.gemstones.map((g) => g.gemstoneRateId);
      const existingRates = await prisma.gemstoneRateMaster.findMany({
        where: { id: { in: gemstoneRateIds }, isActive: true },
      });
      if (existingRates.length !== gemstoneRateIds.length) {
        throw new AppError('One or more gemstone rates are invalid or inactive', 400);
      }
    }

    const product = await prisma.$transaction(async (tx) => {
      const created = await tx.product.create({
        data: {
          sku: data.sku,
          name: data.name,
          slug,
          description: data.description,
          shortDescription: data.shortDescription,
          categoryId: data.categoryId,
          silverPurity: data.silverPurity,
          silverWeightGrams: data.silverWeightGrams,
          makingChargeType: data.makingChargeType,
          makingChargeValue: data.makingChargeValue,
          additionalCharges: data.additionalCharges,
          isActive: data.isActive,
          isFeatured: data.isFeatured ?? false,
          isBestseller: data.isBestseller ?? false,
          isNewArrival: data.isNewArrival ?? false,
          stock: data.stock,
          lowStockThreshold: data.lowStockThreshold ?? 5,
          metaTitle: data.metaTitle,
          metaDescription: data.metaDescription,
          tags: data.tags ?? [],
        },
      });

      // Create images
      if (data.images && data.images.length > 0) {
        await tx.productImage.createMany({
          data: data.images.map((img, index) => ({
            productId: created.id,
            url: img.url,
            altText: img.altText,
            sortOrder: img.sortOrder ?? index,
            isPrimary: img.isPrimary ?? index === 0,
          })),
        });
      }

      // Create gemstone mappings
      if (data.gemstones && data.gemstones.length > 0) {
        await tx.productGemstone.createMany({
          data: data.gemstones.map((gem) => ({
            productId: created.id,
            gemstoneRateId: gem.gemstoneRateId,
            caratWeight: gem.caratWeight,
            quantity: gem.quantity ?? 1,
          })),
        });
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: productIncludes,
      });
    });

    // Invalidate any cached product lists
    await this.invalidateCache();

    return product;
  }

  async update(id: string, data: UpdateProductInput) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // Check slug uniqueness if changing
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.product.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        throw new AppError('A product with this slug already exists', 409);
      }
    }

    // Auto-generate slug if name changed and slug not provided
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = slugify(data.name);
      if (slug !== existing.slug) {
        const slugExists = await prisma.product.findUnique({ where: { slug } });
        if (slugExists) {
          slug = `${slug}-${Date.now()}`;
        }
      }
    }

    // Check SKU uniqueness if changing
    if (data.sku && data.sku !== existing.sku) {
      const skuExists = await prisma.product.findUnique({
        where: { sku: data.sku },
      });
      if (skuExists) {
        throw new AppError('A product with this SKU already exists', 409);
      }
    }

    // Validate category if changing
    if (data.categoryId) {
      const category = await prisma.category.findUnique({
        where: { id: data.categoryId },
      });
      if (!category) {
        throw new AppError('Category not found', 404);
      }
    }

    const { images, gemstones, ...productData } = data;

    const product = await prisma.$transaction(async (tx) => {
      // Update product fields
      await tx.product.update({
        where: { id },
        data: {
          ...productData,
          slug: slug ?? undefined,
        },
      });

      // Handle images update: replace all if provided
      if (images !== undefined) {
        await tx.productImage.deleteMany({ where: { productId: id } });
        if (images.length > 0) {
          await tx.productImage.createMany({
            data: images.map((img, index) => ({
              productId: id,
              url: img.url,
              altText: img.altText,
              sortOrder: img.sortOrder ?? index,
              isPrimary: img.isPrimary ?? index === 0,
            })),
          });
        }
      }

      // Handle gemstones update: replace all if provided
      if (gemstones !== undefined) {
        await tx.productGemstone.deleteMany({ where: { productId: id } });
        if (gemstones.length > 0) {
          // Validate gemstone rate IDs
          const gemstoneRateIds = gemstones.map((g) => g.gemstoneRateId);
          const existingRates = await tx.gemstoneRateMaster.findMany({
            where: { id: { in: gemstoneRateIds }, isActive: true },
          });
          if (existingRates.length !== gemstoneRateIds.length) {
            throw new AppError('One or more gemstone rates are invalid or inactive', 400);
          }

          await tx.productGemstone.createMany({
            data: gemstones.map((gem) => ({
              productId: id,
              gemstoneRateId: gem.gemstoneRateId,
              caratWeight: gem.caratWeight,
              quantity: gem.quantity ?? 1,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id },
        include: productIncludes,
      });
    });

    await this.invalidateCache();

    return product;
  }

  async delete(id: string) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Product not found', 404);
    }

    // Soft delete
    await prisma.product.update({
      where: { id },
      data: { isActive: false },
    });

    await this.invalidateCache();

    return { message: 'Product deleted successfully' };
  }

  async getRelated(productId: string, limit = 8) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { categoryId: true, tags: true },
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    const relatedProducts = await prisma.product.findMany({
      where: {
        isActive: true,
        id: { not: productId },
        OR: [
          { categoryId: product.categoryId },
          { tags: { hasSome: product.tags } },
        ],
      },
      include: productIncludes,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    return attachPrices(relatedProducts as unknown as Record<string, unknown>[]);
  }

  async search(query: string) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { sku: { contains: query, mode: 'insensitive' } },
          { description: { contains: query, mode: 'insensitive' } },
          { tags: { has: query } },
        ],
      },
      include: productIncludes,
      take: 50,
      orderBy: { createdAt: 'desc' },
    });

    return attachPrices(products as unknown as Record<string, unknown>[]);
  }

  async getBestsellers(limit = 10) {
    const cacheKey = `products:bestsellers:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, isBestseller: true },
      include: productIncludes,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const result = await attachPrices(
      products as unknown as Record<string, unknown>[]
    );

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300); // 5 min cache
    return result;
  }

  async getNewArrivals(limit = 10) {
    const cacheKey = `products:new-arrivals:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, isNewArrival: true },
      include: productIncludes,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const result = await attachPrices(
      products as unknown as Record<string, unknown>[]
    );

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    return result;
  }

  async getFeatured(limit = 10) {
    const cacheKey = `products:featured:${limit}`;
    const cached = await redis.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    const products = await prisma.product.findMany({
      where: { isActive: true, isFeatured: true },
      include: productIncludes,
      take: limit,
      orderBy: { createdAt: 'desc' },
    });

    const result = await attachPrices(
      products as unknown as Record<string, unknown>[]
    );

    await redis.set(cacheKey, JSON.stringify(result), 'EX', 300);
    return result;
  }

  async bulkUpdateStock(updates: { productId: string; stock: number }[]) {
    const results = await prisma.$transaction(
      updates.map((u) =>
        prisma.product.update({
          where: { id: u.productId },
          data: { stock: u.stock },
          select: { id: true, sku: true, name: true, stock: true },
        })
      )
    );

    await this.invalidateCache();

    return results;
  }

  private async invalidateCache() {
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
    }
  }
}

export const productService = new ProductService();
