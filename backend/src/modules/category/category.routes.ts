import { Router } from 'express';
import { categoryController } from './category.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryQuerySchema,
} from './category.schema';

const router = Router();

// Public routes
router.get('/', validate(categoryQuerySchema), categoryController.getAll);
router.get('/tree', validate(categoryQuerySchema), categoryController.getTree);
router.get('/:slug', categoryController.getBySlug);

// Admin routes
router.post(
  '/',
  authenticate,
  authorize('ADMIN'),
  validate(createCategorySchema),
  categoryController.create
);

router.put(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  validate(updateCategorySchema),
  categoryController.update
);

router.delete(
  '/:id',
  authenticate,
  authorize('ADMIN'),
  categoryController.delete
);

export default router;
