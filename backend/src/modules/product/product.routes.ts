import { Router } from 'express';
import { productController } from './product.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createProductSchema,
  updateProductSchema,
  productQuerySchema,
} from './product.schema';

const router = Router();

// Public routes
router.get('/', validate(productQuerySchema), productController.getAll);
router.get('/search', productController.search);
router.get('/featured', productController.getFeatured);
router.get('/bestsellers', productController.getBestsellers);
router.get('/new-arrivals', productController.getNewArrivals);
router.get('/:slug', productController.getBySlug);
router.get('/:id/related', productController.getRelated);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createProductSchema),
  productController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateProductSchema),
  productController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  productController.delete
);

router.patch(
  '/bulk-stock',
  authenticate,
  authorize('ADMIN', 'STAFF'),
  productController.bulkUpdateStock
);

export default router;
