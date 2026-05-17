import { Router } from 'express';
import { orderController } from './order.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import {
  createOrderSchema,
  updateOrderStatusSchema,
  returnRequestSchema,
  processReturnSchema,
  orderListSchema,
  adminOrderListSchema,
} from './order.schema';

const router = Router();

// All order routes require authentication
router.use(authenticate);

// Customer routes
router.post('/', validate(createOrderSchema), orderController.createOrder);
router.get('/', validate(orderListSchema), orderController.getMyOrders);

// Admin routes (must come before /:id to avoid route conflicts)
router.get(
  '/admin/all',
  authorize('ADMIN', 'STAFF'),
  validate(adminOrderListSchema),
  orderController.getAllOrders
);
router.get(
  '/admin/stats',
  authorize('ADMIN', 'STAFF'),
  orderController.getOrderStats
);
router.put(
  '/returns/:returnId',
  authorize('ADMIN', 'STAFF'),
  validate(processReturnSchema),
  orderController.processReturn
);

// Customer routes with order ID
router.get('/:id', orderController.getOrderById);
router.put(
  '/:id/status',
  authorize('ADMIN', 'STAFF'),
  validate(updateOrderStatusSchema),
  orderController.updateStatus
);
router.post('/:id/cancel', orderController.cancelOrder);
router.post('/:id/return', validate(returnRequestSchema), orderController.requestReturn);
router.get('/:id/invoice', orderController.getInvoice);

export default router;
