import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.coerce.number().default(5000),
  DATABASE_URL: z.string(),
  REDIS_URL: z.string().default('redis://localhost:6379'),
  SESSION_SECRET: z.string().min(16),
  FRONTEND_URL: z.string().default('http://localhost:3000'),
  BACKEND_URL: z.string().default('http://localhost:5000'),

  // Silver Rate
  SILVER_RATE_API_KEY: z.string().default(''),
  SILVER_RATE_API_URL: z.string().default('https://api.metalpriceapi.com/v1'),
  SILVER_RATE_BUFFER_PERCENT: z.coerce.number().default(2),

  // Razorpay
  RAZORPAY_KEY_ID: z.string().default(''),
  RAZORPAY_KEY_SECRET: z.string().default(''),
  RAZORPAY_WEBHOOK_SECRET: z.string().default(''),

  // Shiprocket
  SHIPROCKET_EMAIL: z.string().default(''),
  SHIPROCKET_PASSWORD: z.string().default(''),
  SHIPROCKET_API_URL: z.string().default('https://apiv2.shiprocket.in/v1/external'),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().default(''),
  AWS_SECRET_ACCESS_KEY: z.string().default(''),
  AWS_REGION: z.string().default('ap-south-1'),
  AWS_S3_BUCKET: z.string().default('jewelup-assets'),
  CLOUDFRONT_URL: z.string().default(''),

  // Email
  SENDGRID_API_KEY: z.string().default(''),
  EMAIL_FROM: z.string().default('noreply@jewelupbysarita.com'),

  // SMS
  MSG91_AUTH_KEY: z.string().default(''),
  MSG91_SENDER_ID: z.string().default('JWLUP'),
  MSG91_TEMPLATE_ID: z.string().default(''),

  // WhatsApp
  GUPSHUP_API_KEY: z.string().default(''),
  GUPSHUP_APP_NAME: z.string().default('JewelupBySarita'),

  // Meta Marketing (Facebook/Instagram Ads)
  META_ACCESS_TOKEN: z.string().default(''),
  META_AD_ACCOUNT_ID: z.string().default(''),
  META_APP_ID: z.string().default(''),
  META_APP_SECRET: z.string().default(''),
  META_PIXEL_ID: z.string().default(''),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const config = parsed.data;
export type Config = z.infer<typeof envSchema>;
