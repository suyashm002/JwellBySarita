import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './wishlist.controller';

const router = Router();

router.use(authenticate);

router.get('/', controller.getWishlist);
router.post('/', controller.addToWishlist);
router.delete('/:productId', controller.removeFromWishlist);

export default router;
