import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type { UpdateProfileInput, AddressInput, UpdateAddressInput } from './user.schema';

const profileSelect = {
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

export class UserService {
  // ─── Profile ───────────────────────────────────────────

  async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: profileSelect,
    });

    if (!user) {
      throw new AppError('User not found', 404);
    }

    return user;
  }

  async updateProfile(userId: string, data: UpdateProfileInput) {
    // If updating email, check uniqueness
    if (data.email) {
      const existing = await prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existing && existing.id !== userId) {
        throw new AppError('Email is already in use by another account', 409);
      }
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(data.name !== undefined && { name: data.name }),
        ...(data.email !== undefined && { email: data.email, emailVerified: false }),
      },
      select: profileSelect,
    });

    return user;
  }

  // ─── Addresses ─────────────────────────────────────────

  async getAddresses(userId: string) {
    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });

    return addresses;
  }

  async addAddress(userId: string, data: AddressInput) {
    // If this address should be default, unset other defaults first
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    const address = await prisma.address.create({
      data: {
        userId,
        label: data.label,
        name: data.name,
        phone: data.phone,
        line1: data.line1,
        line2: data.line2,
        city: data.city,
        state: data.state,
        pincode: data.pincode,
        isDefault: data.isDefault ?? false,
      },
    });

    return address;
  }

  async updateAddress(userId: string, addressId: string, data: UpdateAddressInput) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new AppError('Address not found', 404);
    }

    // If setting as default, unset other defaults first
    if (data.isDefault) {
      await prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: addressId } },
        data: { isDefault: false },
      });
    }

    const updated = await prisma.address.update({
      where: { id: addressId },
      data,
    });

    return updated;
  }

  async deleteAddress(userId: string, addressId: string) {
    const address = await prisma.address.findUnique({
      where: { id: addressId },
    });

    if (!address || address.userId !== userId) {
      throw new AppError('Address not found', 404);
    }

    await prisma.address.delete({
      where: { id: addressId },
    });

    return { message: 'Address deleted successfully' };
  }

  // ─── Admin: Customer Management ────────────────────────

  async getCustomers(page: number, limit: number, search?: string) {
    const where: Record<string, unknown> = { role: 'CUSTOMER' };

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
        { phone: { contains: search } },
      ];
    }

    const [customers, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          ...profileSelect,
          _count: {
            select: { orders: true },
          },
        },
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { customers, total };
  }

  async getCustomerDetail(customerId: string) {
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: {
        ...profileSelect,
        addresses: true,
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            paymentStatus: true,
            grandTotal: true,
            createdAt: true,
          },
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        _count: {
          select: { orders: true, reviews: true, wishlists: true },
        },
      },
    });

    if (!customer) {
      throw new AppError('Customer not found', 404);
    }

    // Calculate lifetime value
    const lifetimeValue = await prisma.order.aggregate({
      where: {
        userId: customerId,
        paymentStatus: 'PAID',
      },
      _sum: { grandTotal: true },
    });

    return {
      ...customer,
      lifetimeValue: lifetimeValue._sum.grandTotal ?? 0,
    };
  }
}

export const userService = new UserService();
