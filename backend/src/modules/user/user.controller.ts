import { Request, Response, NextFunction } from 'express';
import { userService } from './user.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import type { UpdateProfileInput, AddressInput, UpdateAddressInput } from './user.schema';

export class UserController {
  // ─── Profile ───────────────────────────────────────────

  async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const user = await userService.getProfile(req.user!.id);
      return sendSuccess(res, user, 'Profile fetched');
    } catch (error) {
      next(error);
    }
  }

  async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as UpdateProfileInput;
      const user = await userService.updateProfile(req.user!.id, data);
      return sendSuccess(res, user, 'Profile updated');
    } catch (error) {
      next(error);
    }
  }

  // ─── Addresses ─────────────────────────────────────────

  async getAddresses(req: Request, res: Response, next: NextFunction) {
    try {
      const addresses = await userService.getAddresses(req.user!.id);
      return sendSuccess(res, addresses, 'Addresses fetched');
    } catch (error) {
      next(error);
    }
  }

  async addAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as AddressInput;
      const address = await userService.addAddress(req.user!.id, data);
      return sendSuccess(res, address, 'Address added', 201);
    } catch (error) {
      next(error);
    }
  }

  async updateAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = req.body as UpdateAddressInput;
      const address = await userService.updateAddress(req.user!.id, req.params.addressId, data);
      return sendSuccess(res, address, 'Address updated');
    } catch (error) {
      next(error);
    }
  }

  async deleteAddress(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await userService.deleteAddress(req.user!.id, req.params.addressId);
      return sendSuccess(res, null, result.message);
    } catch (error) {
      next(error);
    }
  }

  // ─── Admin: Customer Management ────────────────────────

  async getCustomers(req: Request, res: Response, next: NextFunction) {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const search = req.query.search as string | undefined;

      const { customers, total } = await userService.getCustomers(page, limit, search);
      return sendPaginated(res, customers, total, page, limit, 'Customers fetched');
    } catch (error) {
      next(error);
    }
  }

  async getCustomerDetail(req: Request, res: Response, next: NextFunction) {
    try {
      const customer = await userService.getCustomerDetail(req.params.customerId);
      return sendSuccess(res, customer, 'Customer detail fetched');
    } catch (error) {
      next(error);
    }
  }
}

export const userController = new UserController();
