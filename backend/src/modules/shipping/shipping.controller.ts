import { Request, Response, NextFunction } from 'express';
import { shippingService } from './shipping.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export async function checkServiceability(req: Request, res: Response, next: NextFunction) {
  try {
    const { pincode, weight } = req.query;
    if (!pincode) return sendError(res, 'Pincode is required', 400);
    const result = await shippingService.checkServiceability(pincode as string, Number(weight) || 0.5);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}

export async function trackOrder(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await shippingService.trackShipment(req.params.orderId);
    return sendSuccess(res, result);
  } catch (error) {
    next(error);
  }
}
