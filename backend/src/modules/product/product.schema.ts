import { z } from 'zod';
import { paginationSchema } from '../../utils/pagination';

const silverPurityEnum = z.enum(['STERLING_925', 'FINE_999']);
const makingChargeTypeEnum = z.enum(['FLAT', 'PERCENTAGE', 'PER_GRAM']);

const imageSchema = z.object({
  url: z.string().url('Invalid image URL'),
  altText: z.string().max(200).optional(),
  sortOrder: z.number().int().min(0).optional(),
  isPrimary: z.boolean().optional(),
});

const gemstoneSchema = z.object({
  gemstoneRateId: z.string().uuid('Invalid gemstone rate ID'),
  caratWeight: z.number().positive('Carat weight must be positive'),
  quantity: z.number().int().positive().optional().default(1),
});

export const createProductSchema = z.object({
  body: z.object({
    sku: z.string().min(1, 'SKU is required').max(100),
    name: z.string().min(1, 'Name is required').max(300),
    slug: z.string().max(350).optional(),
    description: z.string().optional(),
    shortDescription: z.string().max(500).optional(),
    categoryId: z.string().uuid('Invalid category ID'),
    silverPurity: silverPurityEnum,
    silverWeightGrams: z.number().positive('Silver weight must be positive'),
    makingChargeType: makingChargeTypeEnum,
    makingChargeValue: z.number().min(0, 'Making charge value must be non-negative'),
    additionalCharges: z.number().min(0).default(0),
    isActive: z.boolean().default(true),
    isFeatured: z.boolean().optional(),
    isBestseller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    stock: z.number().int().min(0, 'Stock must be non-negative'),
    lowStockThreshold: z.number().int().min(0).optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(500).optional(),
    tags: z.array(z.string()).optional(),
    images: z.array(imageSchema).optional(),
    gemstones: z.array(gemstoneSchema).optional(),
  }),
});

export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid product ID'),
  }),
  body: z.object({
    sku: z.string().min(1).max(100).optional(),
    name: z.string().min(1).max(300).optional(),
    slug: z.string().max(350).optional(),
    description: z.string().optional().nullable(),
    shortDescription: z.string().max(500).optional().nullable(),
    categoryId: z.string().uuid('Invalid category ID').optional(),
    silverPurity: silverPurityEnum.optional(),
    silverWeightGrams: z.number().positive().optional(),
    makingChargeType: makingChargeTypeEnum.optional(),
    makingChargeValue: z.number().min(0).optional(),
    additionalCharges: z.number().min(0).optional(),
    isActive: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
    isBestseller: z.boolean().optional(),
    isNewArrival: z.boolean().optional(),
    stock: z.number().int().min(0).optional(),
    lowStockThreshold: z.number().int().min(0).optional(),
    metaTitle: z.string().max(200).optional().nullable(),
    metaDescription: z.string().max(500).optional().nullable(),
    tags: z.array(z.string()).optional(),
    images: z.array(imageSchema).optional(),
    gemstones: z.array(gemstoneSchema).optional(),
  }),
});

export const productQuerySchema = z.object({
  query: paginationSchema.extend({
    categoryId: z.string().uuid().optional(),
    search: z.string().optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    silverPurity: silverPurityEnum.optional(),
    gemstoneType: z.string().optional(),
    isFeatured: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    isBestseller: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    isNewArrival: z
      .enum(['true', 'false'])
      .transform((v) => v === 'true')
      .optional(),
    tags: z
      .string()
      .transform((v) => v.split(',').map((t) => t.trim()))
      .optional(),
  }),
});

export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductQueryInput = z.infer<typeof productQuerySchema>['query'];
