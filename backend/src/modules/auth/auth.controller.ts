import { Request, Response, NextFunction } from 'express';
import { authService } from './auth.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';
import type { RegisterInput, LoginInput, OtpRequestInput, OtpVerifyInput } from './auth.schema';

export class AuthController {
  async register(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as RegisterInput;
      const user = await authService.register(data);

      req.session.userId = user.id;
      req.session.role = user.role;

      return sendSuccess(res, user, 'Registration successful', 201);
    } catch (error) {
      next(error);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, phone, password } = req.body as LoginInput;
      const user = await authService.login({ email, phone }, password);

      req.session.userId = user.id;
      req.session.role = user.role;

      return sendSuccess(res, user, 'Login successful');
    } catch (error) {
      next(error);
    }
  }

  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body as OtpRequestInput;
      const result = await authService.requestOtp(phone);

      return sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, otp } = req.body as OtpVerifyInput;
      const user = await authService.verifyOtp(phone, otp);

      req.session.userId = user.id;
      req.session.role = user.role;

      return sendSuccess(res, user, 'OTP verified successfully');
    } catch (error) {
      next(error);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      req.session.destroy((err) => {
        if (err) {
          return sendError(res, 'Failed to logout', 500);
        }
        res.clearCookie('connect.sid');
        return sendSuccess(res, null, 'Logged out successfully');
      });
    } catch (error) {
      next(error);
    }
  }

  async me(req: Request, res: Response, next: NextFunction) {
    try {
      return sendSuccess(res, req.user, 'User profile fetched');
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
