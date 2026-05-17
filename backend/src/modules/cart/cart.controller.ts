import { Request, Response, NextFunction } from 'express';
import { cartService } from './cart.service';
import { sendSuccess } from '../../utils/apiResponse';
import type { AddToCartInput, UpdateCartItemInput, ApplyCouponInput } from './cart.schema';

export class CartController {
  async getCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const { cart, items } = await cartService.getCart(cartId);

      return sendSuccess(res, { cart, items }, 'Cart fetched successfully');
    } catch (error) {
      next(error);
    }
  }

  async addItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;
      const { productId, variantId, quantity } = req.body as AddToCartInput;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const item = await cartService.addItem(cartId, productId, variantId, quantity);

      return sendSuccess(res, item, 'Item added to cart', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateItemQuantity(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;
      const { itemId } = req.params;
      const { quantity } = req.body as UpdateCartItemInput;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const item = await cartService.updateItemQuantity(cartId, itemId, quantity);

      return sendSuccess(res, item, 'Cart item updated');
    } catch (error) {
      next(error);
    }
  }

  async removeItem(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;
      const { itemId } = req.params;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      await cartService.removeItem(cartId, itemId);

      return sendSuccess(res, null, 'Item removed from cart');
    } catch (error) {
      next(error);
    }
  }

  async clearCart(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      await cartService.clearCart(cartId);

      return sendSuccess(res, null, 'Cart cleared');
    } catch (error) {
      next(error);
    }
  }

  async applyCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;
      const { code } = req.body as ApplyCouponInput;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const result = await cartService.applyCoupon(cartId, code, userId);

      return sendSuccess(res, result, 'Coupon applied successfully');
    } catch (error) {
      next(error);
    }
  }

  async removeCoupon(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      await cartService.removeCoupon(cartId);

      return sendSuccess(res, null, 'Coupon removed');
    } catch (error) {
      next(error);
    }
  }

  async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;
      const state = req.query.state as string | undefined;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const summary = await cartService.getCartSummary(cartId, state);

      return sendSuccess(res, summary, 'Cart summary fetched');
    } catch (error) {
      next(error);
    }
  }

  async checkPriceLock(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user?.id;
      const sessionId = req.session.id;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      const result = await cartService.checkPriceLock(cartId);

      const message = result.expired
        ? result.priceChanged
          ? 'Price lock expired. Prices have been updated.'
          : 'Price lock expired. Prices remain the same.'
        : 'Price lock is still active.';

      return sendSuccess(res, result, message);
    } catch (error) {
      next(error);
    }
  }

  async saveForLater(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const sessionId = req.session.id;
      const { itemId } = req.params;

      const cartId = await cartService.getOrCreateCart(userId, sessionId);
      await cartService.saveForLater(cartId, itemId, userId);

      return sendSuccess(res, null, 'Item saved for later');
    } catch (error) {
      next(error);
    }
  }
}

export const cartController = new CartController();
