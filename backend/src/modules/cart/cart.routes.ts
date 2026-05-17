import { Router } from 'express';
import { cartController } from './cart.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { optionalAuth } from '../../middleware/auth';
import {
  addToCartSchema,
  updateCartItemSchema,
  removeCartItemSchema,
  applyCouponSchema,
  cartSummarySchema,
} from './cart.schema';

const router = Router();

// All cart routes support both authenticated users and guest sessions
router.get('/', optionalAuth, cartController.getCart);
router.post('/items', optionalAuth, validate(addToCartSchema), cartController.addItem);
router.put(
  '/items/:itemId',
  optionalAuth,
  validate(updateCartItemSchema),
  cartController.updateItemQuantity
);
router.delete(
  '/items/:itemId',
  optionalAuth,
  validate(removeCartItemSchema),
  cartController.removeItem
);
router.delete('/', optionalAuth, cartController.clearCart);

router.post('/coupon', optionalAuth, validate(applyCouponSchema), cartController.applyCoupon);
router.delete('/coupon', optionalAuth, cartController.removeCoupon);

router.get('/summary', optionalAuth, validate(cartSummarySchema), cartController.getSummary);
router.get('/price-lock', optionalAuth, cartController.checkPriceLock);

// Save for later requires authentication (need userId for wishlist)
router.post('/items/:itemId/save-for-later', authenticate, cartController.saveForLater);

export default router;
