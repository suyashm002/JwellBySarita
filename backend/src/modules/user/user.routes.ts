import { Router } from 'express';
import { userController } from './user.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { updateProfileSchema, addressSchema, updateAddressSchema } from './user.schema';

const router = Router();

// All user routes require authentication
router.use(authenticate);

// ─── Profile ───────────────────────────────────────────
router.get('/profile', userController.getProfile);
router.patch('/profile', validate(updateProfileSchema), userController.updateProfile);

// ─── Addresses ─────────────────────────────────────────
router.get('/addresses', userController.getAddresses);
router.post('/addresses', validate(addressSchema), userController.addAddress);
router.patch('/addresses/:addressId', validate(updateAddressSchema), userController.updateAddress);
router.delete('/addresses/:addressId', userController.deleteAddress);

// ─── Admin: Customer Management ────────────────────────
router.get('/customers', authorize('ADMIN', 'STAFF'), userController.getCustomers);
router.get('/customers/:customerId', authorize('ADMIN', 'STAFF'), userController.getCustomerDetail);

export default router;
