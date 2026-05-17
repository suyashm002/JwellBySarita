import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import { validate } from '../../middleware/validate';
import {
  silverRateOverrideSchema,
  gemstoneRateSchema,
  updateGemstoneRateSchema,
  makingChargeRuleSchema,
  priceSimulationSchema,
  bufferPercentSchema,
} from './pricing.schema';
import {
  getCurrentSilverRate,
  getSilverRateHistory,
  overrideSilverRate,
  updateBufferPercent,
  getGemstoneRates,
  createGemstoneRate,
  updateGemstoneRate,
  deleteGemstoneRate,
  getMakingChargeRules,
  createMakingChargeRule,
  updateMakingChargeRule,
  deleteMakingChargeRule,
  simulatePrice,
  calculateProductPrice,
} from './pricing.controller';

const router = Router();

// ─────────────────────────────────────────────
// SILVER RATE
// ─────────────────────────────────────────────
router.get('/silver-rate', getCurrentSilverRate);
router.get('/silver-rate/history', authenticate, authorize('ADMIN', 'STAFF'), getSilverRateHistory);
router.post('/silver-rate/override', authenticate, authorize('ADMIN'), validate(silverRateOverrideSchema), overrideSilverRate);
router.put('/silver-rate/buffer', authenticate, authorize('ADMIN'), validate(bufferPercentSchema), updateBufferPercent);

// ─────────────────────────────────────────────
// GEMSTONE RATES
// ─────────────────────────────────────────────
router.get('/gemstone-rates', getGemstoneRates);
router.post('/gemstone-rates', authenticate, authorize('ADMIN'), validate(gemstoneRateSchema), createGemstoneRate);
router.put('/gemstone-rates/:id', authenticate, authorize('ADMIN'), validate(updateGemstoneRateSchema), updateGemstoneRate);
router.delete('/gemstone-rates/:id', authenticate, authorize('ADMIN'), deleteGemstoneRate);

// ─────────────────────────────────────────────
// MAKING CHARGE RULES
// ─────────────────────────────────────────────
router.get('/making-charges', authenticate, authorize('ADMIN', 'STAFF'), getMakingChargeRules);
router.post('/making-charges', authenticate, authorize('ADMIN'), validate(makingChargeRuleSchema), createMakingChargeRule);
router.put('/making-charges/:id', authenticate, authorize('ADMIN'), validate(makingChargeRuleSchema), updateMakingChargeRule);
router.delete('/making-charges/:id', authenticate, authorize('ADMIN'), deleteMakingChargeRule);

// ─────────────────────────────────────────────
// SIMULATION & LIVE PRICE
// ─────────────────────────────────────────────
router.get('/simulate', authenticate, authorize('ADMIN', 'STAFF'), validate(priceSimulationSchema), simulatePrice);
router.post('/calculate/:productId', calculateProductPrice);

export default router;
