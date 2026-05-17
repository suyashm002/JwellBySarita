import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required').max(100),
    email: z
      .string()
      .email('Invalid email address')
      .transform((v) => v.toLowerCase().trim())
      .optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
      .optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }).refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required',
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address')
      .transform((v) => v.toLowerCase().trim())
      .optional(),
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number')
      .optional(),
    password: z.string().min(1, 'Password is required'),
  }).refine((data) => data.email || data.phone, {
    message: 'Either email or phone is required',
  }),
});

export const otpRequestSchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
  }),
});

export const otpVerifySchema = z.object({
  body: z.object({
    phone: z
      .string()
      .regex(/^[6-9]\d{9}$/, 'Invalid Indian phone number'),
    otp: z
      .string()
      .length(6, 'OTP must be 6 digits')
      .regex(/^\d{6}$/, 'OTP must contain only digits'),
  }),
});

export type RegisterInput = z.infer<typeof registerSchema>['body'];
export type LoginInput = z.infer<typeof loginSchema>['body'];
export type OtpRequestInput = z.infer<typeof otpRequestSchema>['body'];
export type OtpVerifyInput = z.infer<typeof otpVerifySchema>['body'];
