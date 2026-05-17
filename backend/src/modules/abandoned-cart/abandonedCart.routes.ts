import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import * as controller from './abandonedCart.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.get('/', controller.getAbandonedCarts);
router.get('/metrics', controller.getRecoveryMetrics);
router.post('/:id/outreach', controller.manualOutreach);

export default router;
