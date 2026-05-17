import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { optionalAuth } from '../../middleware/auth';
import * as controller from './coupon.controller';

const router = Router();

// Public
router.post('/validate', optionalAuth, controller.validateCoupon);

// Admin
router.get('/', authenticate, authorize('ADMIN', 'STAFF'), controller.getAll);
router.get('/:id', authenticate, authorize('ADMIN', 'STAFF'), controller.getById);
router.post('/', authenticate, authorize('ADMIN'), controller.create);
router.put('/:id', authenticate, authorize('ADMIN'), controller.update);
router.delete('/:id', authenticate, authorize('ADMIN'), controller.remove);

export default router;
