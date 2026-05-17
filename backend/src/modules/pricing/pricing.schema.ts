import { z } from 'zod';

export const silverRateOverrideSchema = z.object({
  body: z.object({
    ratePerGram: z.number().positive('Rate per gram must be positive'),
    ratePerKg: z.number().positive('Rate per kg must be positive'),
    note: z.string().max(500).optional(),
  }),
});

export const gemstoneRateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Gemstone name is required').max(100),
    type: z.string().min(1, 'Gemstone type is required').max(50),
    qualityGrade: z.string().min(1, 'Quality grade is required').max(10),
    ratePerCarat: z.number().positive('Rate per carat must be positive'),
    effectiveFrom: z.string().datetime({ message: 'Invalid date format, use ISO 8601' }),
  }),
});

export const updateGemstoneRateSchema = z.object({
  body: z.object({
    name: z.string().min(1).max(100).optional(),
    type: z.string().min(1).max(50).optional(),
    qualityGrade: z.string().min(1).max(10).optional(),
    ratePerCarat: z.number().positive('Rate per carat must be positive').optional(),
    effectiveFrom: z.string().datetime({ message: 'Invalid date format' }).optional(),
  }),
});

export const makingChargeRuleSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Rule name is required').max(100),
    type: z.enum(['FLAT', 'PERCENTAGE', 'PER_GRAM'], {
      errorMap: () => ({ message: 'Type must be FLAT, PERCENTAGE, or PER_GRAM' }),
    }),
    value: z.number().nonnegative('Value must be non-negative'),
    scope: z.enum(['GLOBAL', 'CATEGORY', 'PRODUCT'], {
      errorMap: () => ({ message: 'Scope must be GLOBAL, CATEGORY, or PRODUCT' }),
    }),
    categoryId: z.string().uuid().optional(),
    productId: z.string().uuid().optional(),
  }).refine(
    (data) => {
      if (data.scope === 'CATEGORY' && !data.categoryId) return false;
      if (data.scope === 'PRODUCT' && !data.productId) return false;
      return true;
    },
    { message: 'categoryId is required for CATEGORY scope; productId is required for PRODUCT scope' }
  ),
});

export const priceSimulationSchema = z.object({
  query: z.object({
    silverRate: z.coerce.number().positive('Silver rate must be positive'),
    productId: z.string().uuid().optional(),
  }),
});

export const bufferPercentSchema = z.object({
  body: z.object({
    percent: z
      .number()
      .min(0, 'Buffer percent must be at least 0')
      .max(50, 'Buffer percent cannot exceed 50'),
  }),
});

export type SilverRateOverrideInput = z.infer<typeof silverRateOverrideSchema>['body'];
export type GemstoneRateInput = z.infer<typeof gemstoneRateSchema>['body'];
export type UpdateGemstoneRateInput = z.infer<typeof updateGemstoneRateSchema>['body'];
export type MakingChargeRuleInput = z.infer<typeof makingChargeRuleSchema>['body'];
export type PriceSimulationInput = z.infer<typeof priceSimulationSchema>['query'];
export type BufferPercentInput = z.infer<typeof bufferPercentSchema>['body'];
