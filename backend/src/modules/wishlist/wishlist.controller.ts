import { Request, Response, NextFunction } from 'express';
import { wishlistService } from './wishlist.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function getWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const items = await wishlistService.getWishlist(req.user!.id);
    return sendSuccess(res, items);
  } catch (error) {
    next(error);
  }
}

export async function addToWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    const item = await wishlistService.addToWishlist(req.user!.id, req.body.productId);
    return sendSuccess(res, item, 'Added to wishlist', 201);
  } catch (error) {
    next(error);
  }
}

export async function removeFromWishlist(req: Request, res: Response, next: NextFunction) {
  try {
    await wishlistService.removeFromWishlist(req.user!.id, req.params.productId as string);
    return sendSuccess(res, null, 'Removed from wishlist');
  } catch (error) {
    next(error);
  }
}
