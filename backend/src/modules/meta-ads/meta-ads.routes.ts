import { Router } from 'express';
import { authenticate } from '../../middleware/auth';
import { authorize } from '../../middleware/rbac';
import * as controller from './meta-ads.controller';

const router = Router();

// All routes require admin authentication
const adminAuth = [authenticate, authorize('ADMIN')];

// Account
router.get('/account', ...adminAuth, controller.getAccount);

// Campaigns
router.get('/campaigns', ...adminAuth, controller.getCampaigns);
router.post('/campaigns', ...adminAuth, controller.createCampaign);
router.put('/campaigns/:id', ...adminAuth, controller.updateCampaign);
router.post('/campaigns/:id/pause', ...adminAuth, controller.pauseCampaign);
router.post('/campaigns/:id/resume', ...adminAuth, controller.resumeCampaign);
router.delete('/campaigns/:id', ...adminAuth, controller.deleteCampaign);

// Campaign Insights
router.get('/campaigns/:id/insights', ...adminAuth, controller.getCampaignInsights);

// Ad Sets
router.get('/campaigns/:id/adsets', ...adminAuth, controller.getAdSets);
router.post('/campaigns/:id/adsets', ...adminAuth, controller.createAdSet);

// Ads
router.get('/adsets/:id/ads', ...adminAuth, controller.getAds);
router.post('/adsets/:id/ads', ...adminAuth, controller.createAd);

// Ad Insights
router.get('/ads/:id/insights', ...adminAuth, controller.getAdInsights);

// Account Overview Insights
router.get('/insights', ...adminAuth, controller.getAccountInsights);

// Product Catalog Sync
router.post('/sync-catalog', ...adminAuth, controller.syncCatalog);

// Audiences
router.get('/audiences', ...adminAuth, controller.getAudiences);

export default router;
