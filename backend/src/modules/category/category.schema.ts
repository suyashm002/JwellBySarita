import { z } from 'zod';

const categoryTypeEnum = z.enum([
  'PRODUCT_TYPE',
  'OCCASION',
  'GEMSTONE_TYPE',
  'COLLECTION',
]);

export const createCategorySchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(200),
    slug: z.string().max(250).optional(),
    description: z.string().max(2000).optional(),
    image: z.string().url('Invalid image URL').optional(),
    parentId: z.string().uuid('Invalid parent ID').optional(),
    type: categoryTypeEnum,
    isActive: z.boolean().default(true),
    sortOrder: z.number().int().min(0).optional(),
    metaTitle: z.string().max(200).optional(),
    metaDescription: z.string().max(500).optional(),
  }),
});

export const updateCategorySchema = z.object({
  params: z.object({
    id: z.string().uuid('Invalid category ID'),
  }),
  body: z.object({
    name: z.string().min(1).max(200).optional(),
    slug: z.string().max(250).optional(),
    description: z.string().max(2000).optional(),
    image: z.string().url('Invalid image URL').optional().nullable(),
    parentId: z.string().uuid('Invalid parent ID').optional().nullable(),
    type: categoryTypeEnum.optional(),
    isActive: z.boolean().optional(),
    sortOrder: z.number().int().min(0).optional(),
    metaTitle: z.string().max(200).optional().nullable(),
    metaDescription: z.string().max(500).optional().nullable(),
  }),
});

export const categoryQuerySchema = z.object({
  query: z.object({
    type: categoryTypeEnum.optional(),
  }),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>['body'];
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>['body'];
