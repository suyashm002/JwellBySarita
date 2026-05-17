import bcrypt from 'bcryptjs';
import prisma from '../../config/database';
import redis from '../../config/redis';
import { AppError } from '../../middleware/errorHandler';
import logger from '../../utils/logger';
import type { RegisterInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 12;
const OTP_TTL_SECONDS = 300; // 5 minutes
const OTP_KEY_PREFIX = 'otp:';

// Fields to return for user (excludes passwordHash)
const userSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  isActive: true,
  emailVerified: true,
  phoneVerified: true,
  createdAt: true,
  updatedAt: true,
};

export class AuthService {
  async register(data: RegisterInput) {
    // Check for existing user by email or phone
    if (data.email) {
      const existingByEmail = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingByEmail) {
        throw new AppError('An account with this email already exists', 409);
      }
    }

    if (data.phone) {
      const existingByPhone = await prisma.user.findUnique({
        where: { phone: data.phone },
      });
      if (existingByPhone) {
        throw new AppError('An account with this phone number already exists', 409);
      }
    }

    const passwordHash = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        phone: data.phone,
        passwordHash,
      },
      select: userSelect,
    });

    return user;
  }

  async login(identifier: { email?: string; phone?: string }, password: string) {
    const where = identifier.email
      ? { email: identifier.email }
      : { phone: identifier.phone };

    const user = await prisma.user.findUnique({ where });

    if (!user) {
      throw new AppError('Invalid credentials', 401);
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact support.', 403);
    }

    if (!user.passwordHash) {
      throw new AppError('Please login using OTP or the method you originally signed up with', 400);
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Return user without passwordHash
    const { passwordHash: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  async requestOtp(phone: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const redisKey = `${OTP_KEY_PREFIX}${phone}`;

    await redis.set(redisKey, otp, 'EX', OTP_TTL_SECONDS);

    // In production, send OTP via SMS (e.g., MSG91)
    logger.info({ phone, otp }, 'OTP generated (dev mode — would send via SMS in production)');

    return { message: 'OTP sent successfully' };
  }

  async verifyOtp(phone: string, otp: string) {
    const redisKey = `${OTP_KEY_PREFIX}${phone}`;
    const storedOtp = await redis.get(redisKey);

    if (!storedOtp) {
      throw new AppError('OTP expired or not found. Please request a new one.', 400);
    }

    if (storedOtp !== otp) {
      throw new AppError('Invalid OTP', 400);
    }

    // Delete the OTP after successful verification
    await redis.del(redisKey);

    // Find or create user
    let user = await prisma.user.findUnique({
      where: { phone },
      select: userSelect,
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          phone,
          phoneVerified: true,
        },
        select: userSelect,
      });
    } else {
      // Mark phone as verified if not already
      if (!user.phoneVerified) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: { phoneVerified: true },
          select: userSelect,
        });
      }
    }

    if (!user.isActive) {
      throw new AppError('Account is deactivated. Please contact support.', 403);
    }

    return user;
  }
}

export const authService = new AuthService();
