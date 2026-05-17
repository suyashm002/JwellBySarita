import { Request, Response, NextFunction } from 'express';
import { couponService } from './coupon.service';
import { sendSuccess, sendPaginated, sendError } from '../../utils/apiResponse';

export async function getAll(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const { coupons, total } = await couponService.getAll(page, limit);
    return sendPaginated(res, coupons, total, page, limit);
  } catch (error) {
    next(error);
  }
}

export async function getById(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.getById(req.params.id as string);
    if (!coupon) return sendError(res, 'Coupon not found', 404);
    return sendSuccess(res, coupon);
  } catch (error) {
    next(error);
  }
}

export async function create(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.create(req.body);
    return sendSuccess(res, coupon, 'Coupon created', 201);
  } catch (error) {
    next(error);
  }
}

export async function update(req: Request, res: Response, next: NextFunction) {
  try {
    const coupon = await couponService.update(req.params.id as string, req.body);
    return sendSuccess(res, coupon, 'Coupon updated');
  } catch (error) {
    next(error);
  }
}

export async function remove(req: Request, res: Response, next: NextFunction) {
  try {
    await couponService.delete(req.params.id as string);
    return sendSuccess(res, null, 'Coupon deactivated');
  } catch (error) {
    next(error);
  }
}

export async function validateCoupon(req: Request, res: Response, next: NextFunction) {
  try {
    const { code, cartValue } = req.body;
    const result = await couponService.validate(code, cartValue, req.user?.id);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
