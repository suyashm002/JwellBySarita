import { z } from 'zod';

export const updateProfileSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name cannot be empty').max(100).optional(),
    email: z
      .string()
      .email('Invalid email address')
      .transform((v) => v.toLowerCase().trim())
      .optional(),
  }),
});

export const addressSchema = z.object({
  body: z.object({
    label: z.string().min(1, 'Label is required').max(50),
    name: z.string().min(1, 'Name is required').max(100),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    line1: z.string().min(1, 'Address line 1 is required').max(255),
    line2: z.string().max(255).optional(),
    city: z.string().min(1, 'City is required').max(100),
    state: z.string().min(1, 'State is required').max(100),
    pincode: z
      .string()
      .regex(/^\d{6}$/, 'Pincode must be 6 digits'),
    isDefault: z.boolean().optional().default(false),
  }),
});

export const updateAddressSchema = z.object({
  body: z.object({
    label: z.string().min(1).max(50).optional(),
    name: z.string().min(1).max(100).optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
      .optional(),
    line1: z.string().min(1).max(255).optional(),
    line2: z.string().max(255).optional().nullable(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(100).optional(),
    pincode: z
      .string()
      .regex(/^\d{6}$/, 'Pincode must be 6 digits')
      .optional(),
    isDefault: z.boolean().optional(),
  }),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>['body'];
export type AddressInput = z.infer<typeof addressSchema>['body'];
export type UpdateAddressInput = z.infer<typeof updateAddressSchema>['body'];
