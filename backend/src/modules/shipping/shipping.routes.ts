import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import * as controller from './shipping.controller';

const router = Router();

router.get('/serviceability', controller.checkServiceability);
router.get('/track/:orderId', authenticate, controller.trackOrder);

export default router;
