import { Request, Response, NextFunction } from 'express';
import { metaAdsService } from './meta-ads.service';
import { sendSuccess, sendError } from '../../utils/apiResponse';

export async function getAccount(req: Request, res: Response, next: NextFunction) {
  try {
    const account = await metaAdsService.getAccountInfo();
    return sendSuccess(res, account);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function getCampaigns(req: Request, res: Response, next: NextFunction) {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await metaAdsService.getCampaigns(page, limit);
    return sendSuccess(res, result);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function createCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const campaign = await metaAdsService.createCampaign(req.body);
    return sendSuccess(res, campaign, 'Campaign created', 201);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function updateCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const campaign = await metaAdsService.updateCampaign(req.params.id, req.body);
    return sendSuccess(res, campaign, 'Campaign updated');
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function pauseCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await metaAdsService.pauseCampaign(req.params.id);
    return sendSuccess(res, result, 'Campaign paused');
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function resumeCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await metaAdsService.resumeCampaign(req.params.id);
    return sendSuccess(res, result, 'Campaign resumed');
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function deleteCampaign(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await metaAdsService.deleteCampaign(req.params.id);
    return sendSuccess(res, result, 'Campaign deleted');
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function getCampaignInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const dateRange =
      req.query.since && req.query.until
        ? { since: req.query.since as string, until: req.query.until as string }
        : undefined;
    const insights = await metaAdsService.getCampaignInsights(req.params.id, dateRange);
    return sendSuccess(res, insights);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function getAdSets(req: Request, res: Response, next: NextFunction) {
  try {
    const adSets = await metaAdsService.getAdSets(req.params.id);
    return sendSuccess(res, adSets);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function createAdSet(req: Request, res: Response, next: NextFunction) {
  try {
    const adSet = await metaAdsService.createAdSet(req.params.id, req.body);
    return sendSuccess(res, adSet, 'Ad set created', 201);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function getAds(req: Request, res: Response, next: NextFunction) {
  try {
    const ads = await metaAdsService.getAds(req.params.id);
    return sendSuccess(res, ads);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function createAd(req: Request, res: Response, next: NextFunction) {
  try {
    const ad = await metaAdsService.createAd(req.params.id, req.body);
    return sendSuccess(res, ad, 'Ad created', 201);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function getAdInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const dateRange =
      req.query.since && req.query.until
        ? { since: req.query.since as string, until: req.query.until as string }
        : undefined;
    const insights = await metaAdsService.getAdInsights(req.params.id, dateRange);
    return sendSuccess(res, insights);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function getAccountInsights(req: Request, res: Response, next: NextFunction) {
  try {
    const dateRange =
      req.query.since && req.query.until
        ? { since: req.query.since as string, until: req.query.until as string }
        : undefined;
    const insights = await metaAdsService.getAccountInsights(dateRange);
    return sendSuccess(res, insights);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function syncCatalog(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await metaAdsService.syncProductCatalog();
    return sendSuccess(res, result, 'Product catalog synced');
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}

export async function getAudiences(req: Request, res: Response, next: NextFunction) {
  try {
    const audiences = await metaAdsService.getAudiences();
    return sendSuccess(res, audiences);
  } catch (error: any) {
    if (error.response?.data?.error) {
      return sendError(res, error.response.data.error.message, error.response.status || 500);
    }
    next(error);
  }
}
