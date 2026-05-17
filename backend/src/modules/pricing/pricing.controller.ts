import { Request, Response, NextFunction } from 'express';
import { pricingService } from './pricing.service';
import { sendSuccess } from '../../utils/apiResponse';
import { AppError } from '../../middleware/errorHandler';

// ─────────────────────────────────────────────
// SILVER RATE
// ─────────────────────────────────────────────

export async function getCurrentSilverRate(req: Request, res: Response, next: NextFunction) {
  try {
    const rate = await pricingService.getCurrentSilverRate();
    sendSuccess(res, rate, 'Current silver rate retrieved');
  } catch (error) {
    next(error);
  }
}

export async function getSilverRateHistory(req: Request, res: Response, next: NextFunction) {
  try {
    const days = req.query.days ? parseInt(req.query.days as string, 10) : 30;
    if (isNaN(days) || days < 1 || days > 365) {
      throw new AppError('Days must be between 1 and 365', 400);
    }
    const history = await pricingService.getSilverRateHistory(days);
    sendSuccess(res, history, 'Silver rate history retrieved');
  } catch (error) {
    next(error);
  }
}

export async function overrideSilverRate(req: Request, res: Response, next: NextFunction) {
  try {
    const { ratePerGram, ratePerKg, note } = req.body;
    const adminId = req.user!.id;
    const rate = await pricingService.setSilverRateManual(ratePerGram, ratePerKg, adminId, note);
    sendSuccess(res, rate, 'Silver rate updated successfully', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateBufferPercent(req: Request, res: Response, next: NextFunction) {
  try {
    const { percent } = req.body;
    const result = await pricingService.setBufferPercent(percent);
    sendSuccess(res, result, 'Buffer percent updated successfully');
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// GEMSTONE RATES
// ─────────────────────────────────────────────

export async function getGemstoneRates(req: Request, res: Response, next: NextFunction) {
  try {
    const rates = await pricingService.getGemstoneRates();
    sendSuccess(res, rates, 'Gemstone rates retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createGemstoneRate(req: Request, res: Response, next: NextFunction) {
  try {
    const rate = await pricingService.createGemstoneRate(req.body);
    sendSuccess(res, rate, 'Gemstone rate created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateGemstoneRate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const rate = await pricingService.updateGemstoneRate(id, req.body);
    sendSuccess(res, rate, 'Gemstone rate updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteGemstoneRate(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await pricingService.deleteGemstoneRate(id);
    sendSuccess(res, null, 'Gemstone rate deactivated');
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// MAKING CHARGE RULES
// ─────────────────────────────────────────────

export async function getMakingChargeRules(req: Request, res: Response, next: NextFunction) {
  try {
    const rules = await pricingService.getMakingChargeRules();
    sendSuccess(res, rules, 'Making charge rules retrieved');
  } catch (error) {
    next(error);
  }
}

export async function createMakingChargeRule(req: Request, res: Response, next: NextFunction) {
  try {
    const rule = await pricingService.createMakingChargeRule(req.body);
    sendSuccess(res, rule, 'Making charge rule created', 201);
  } catch (error) {
    next(error);
  }
}

export async function updateMakingChargeRule(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    const rule = await pricingService.updateMakingChargeRule(id, req.body);
    sendSuccess(res, rule, 'Making charge rule updated');
  } catch (error) {
    next(error);
  }
}

export async function deleteMakingChargeRule(req: Request, res: Response, next: NextFunction) {
  try {
    const id = req.params.id as string;
    await pricingService.deleteMakingChargeRule(id);
    sendSuccess(res, null, 'Making charge rule deactivated');
  } catch (error) {
    next(error);
  }
}

// ─────────────────────────────────────────────
// SIMULATION & LIVE PRICE
// ─────────────────────────────────────────────

export async function simulatePrice(req: Request, res: Response, next: NextFunction) {
  try {
    const silverRate = parseFloat(req.query.silverRate as string);
    const productId = req.query.productId as string | undefined;

    if (isNaN(silverRate) || silverRate <= 0) {
      throw new AppError('Invalid silver rate for simulation', 400);
    }

    const result = await pricingService.simulatePrice(silverRate, productId);
    sendSuccess(res, result, 'Price simulation complete');
  } catch (error) {
    next(error);
  }
}

export async function calculateProductPrice(req: Request, res: Response, next: NextFunction) {
  try {
    const productId = req.params.productId as string;
    const breakdown = await pricingService.calculateProductPriceById(productId);
    sendSuccess(res, breakdown, 'Product price calculated');
  } catch (error) {
    next(error);
  }
}
