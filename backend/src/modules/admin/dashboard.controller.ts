import { Request, Response, NextFunction } from 'express';
import { dashboardService } from './dashboard.service';
import { sendSuccess } from '../../utils/apiResponse';

export async function getOverview(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getOverview();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getSalesReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();
    const data = await dashboardService.getSalesReport(fromDate, toDate);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getGSTReport(req: Request, res: Response, next: NextFunction) {
  try {
    const { from, to } = req.query;
    const fromDate = from ? new Date(from as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const toDate = to ? new Date(to as string) : new Date();
    const data = await dashboardService.getGSTReport(fromDate, toDate);
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}

export async function getInventoryValuation(req: Request, res: Response, next: NextFunction) {
  try {
    const data = await dashboardService.getInventoryValuation();
    return sendSuccess(res, data);
  } catch (error) {
    next(error);
  }
}
