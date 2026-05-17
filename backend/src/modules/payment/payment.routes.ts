import { Router } from 'express';
import { paymentController } from './payment.controller';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';

const router = Router();

// Create Razorpay order (authenticated user)
router.post('/create-order', authenticate, paymentController.createOrder);

// Verify payment after checkout (authenticated user)
router.post('/verify', authenticate, paymentController.verifyPayment);

// Razorpay webhook (no auth, raw body, signature verified in service)
router.post('/webhook', paymentController.webhook);

// Admin: initiate refund
router.post('/refund', authenticate, authorize('ADMIN'), paymentController.refund);

export default router;
