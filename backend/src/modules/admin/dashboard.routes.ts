import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import * as controller from './dashboard.controller';

const router = Router();

router.use(authenticate, authorize('ADMIN', 'STAFF'));

router.get('/overview', controller.getOverview);
router.get('/sales-report', controller.getSalesReport);
router.get('/gst-report', controller.getGSTReport);
router.get('/inventory-valuation', controller.getInventoryValuation);

export default router;
