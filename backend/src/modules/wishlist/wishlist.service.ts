import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

class WishlistService {
  async getWishlist(userId: string) {
    return prisma.wishlist.findMany({
      where: { userId },
      include: {
        product: {
          include: {
            images: { where: { isPrimary: true }, take: 1 },
            category: { select: { name: true, slug: true } },
            gemstones: { include: { gemstoneRate: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async addToWishlist(userId: string, productId: string) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) throw new AppError('Product not found', 404);

    const existing = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    if (existing) return existing;

    return prisma.wishlist.create({ data: { userId, productId } });
  }

  async removeFromWishlist(userId: string, productId: string) {
    await prisma.wishlist.deleteMany({ where: { userId, productId } });
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const item = await prisma.wishlist.findUnique({
      where: { userId_productId: { userId, productId } },
    });
    return !!item;
  }
}

export const wishlistService = new WishlistService();
export default wishlistService;
