import { Router } from 'express';
import { authController } from './auth.controller';
import { validate } from '../../middleware/validate';
import { authenticate } from '../../middleware/auth';
import {
  registerSchema,
  loginSchema,
  otpRequestSchema,
  otpVerifySchema,
} from './auth.schema';

const router = Router();

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.post('/otp/request', validate(otpRequestSchema), authController.requestOtp);
router.post('/otp/verify', validate(otpVerifySchema), authController.verifyOtp);
router.post('/logout', authController.logout);
router.get('/me', authenticate, authController.me);

export default router;
