import { z } from 'zod';

const OrderStatusEnum = z.enum([
  'PENDING',
  'CONFIRMED',
  'PACKED',
  'QUALITY_CHECKED',
  'DISPATCHED',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'RETURNED',
]);

const PaymentMethodEnum = z.enum(['RAZORPAY', 'COD']);

export const createOrderSchema = z.object({
  body: z.object({
    addressId: z.string().uuid('Invalid address ID'),
    paymentMethod: PaymentMethodEnum,
    giftWrap: z.boolean().default(false),
    giftMessage: z.string().max(500).optional(),
    shippingInsurance: z.boolean().default(false),
    couponCode: z
      .string()
      .max(50)
      .transform((v) => v.toUpperCase().trim())
      .optional(),
    notes: z.string().max(1000).optional(),
  }),
});

export const updateOrderStatusSchema = z.object({
  body: z.object({
    status: OrderStatusEnum,
    note: z.string().max(500).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const returnRequestSchema = z.object({
  body: z.object({
    orderItemId: z.string().uuid('Invalid order item ID').optional(),
    reason: z.string().min(1, 'Reason is required').max(500),
    description: z.string().max(2000).optional(),
  }),
  params: z.object({
    id: z.string().uuid('Invalid order ID'),
  }),
});

export const processReturnSchema = z.object({
  body: z.object({
    approve: z.boolean(),
    adminNote: z.string().max(1000).optional(),
    refundAmount: z.number().positive().optional(),
  }),
  params: z.object({
    returnId: z.string().uuid('Invalid return ID'),
  }),
});

export const orderListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(10),
  }),
});

export const adminOrderListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
    status: OrderStatusEnum.optional(),
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
    search: z.string().max(100).optional(),
  }),
});

export type CreateOrderInput = z.infer<typeof createOrderSchema>['body'];
export type UpdateOrderStatusInput = z.infer<typeof updateOrderStatusSchema>['body'];
export type ReturnRequestInput = z.infer<typeof returnRequestSchema>['body'];
export type ProcessReturnInput = z.infer<typeof processReturnSchema>['body'];
