import { z } from 'zod';

export const addToCartSchema = z.object({
  body: z.object({
    productId: z.string().uuid('Invalid product ID'),
    variantId: z.string().uuid('Invalid variant ID').optional(),
    quantity: z.number().int().min(1, 'Quantity must be at least 1').default(1),
  }),
});

export const updateCartItemSchema = z.object({
  body: z.object({
    quantity: z.number().int().min(1, 'Quantity must be at least 1'),
  }),
  params: z.object({
    itemId: z.string().uuid('Invalid item ID'),
  }),
});

export const removeCartItemSchema = z.object({
  params: z.object({
    itemId: z.string().uuid('Invalid item ID'),
  }),
});

export const applyCouponSchema = z.object({
  body: z.object({
    code: z
      .string()
      .min(1, 'Coupon code is required')
      .max(50)
      .transform((v) => v.toUpperCase().trim()),
  }),
});

export const cartSummarySchema = z.object({
  query: z.object({
    state: z.string().max(50).optional(),
  }),
});

export type AddToCartInput = z.infer<typeof addToCartSchema>['body'];
export type UpdateCartItemInput = z.infer<typeof updateCartItemSchema>['body'];
export type ApplyCouponInput = z.infer<typeof applyCouponSchema>['body'];
