import axios, { AxiosInstance } from 'axios';
import { config } from '../../config';
import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';

const GRAPH_API_BASE = 'https://graph.facebook.com/v21.0';

class MetaAdsService {
  private client: AxiosInstance;
  private adAccountId: string;

  constructor() {
    this.adAccountId = config.META_AD_ACCOUNT_ID;

    this.client = axios.create({
      baseURL: GRAPH_API_BASE,
      params: {
        access_token: config.META_ACCESS_TOKEN,
      },
    });
  }

  private ensureConfigured() {
    if (!config.META_ACCESS_TOKEN || !config.META_AD_ACCOUNT_ID) {
      throw new AppError(
        'Meta Marketing API is not configured. Please set META_ACCESS_TOKEN and META_AD_ACCOUNT_ID.',
        400
      );
    }
  }

  // ──────────────── Account ────────────────

  async getAccountInfo() {
    this.ensureConfigured();

    const { data } = await this.client.get(`/${this.adAccountId}`, {
      params: {
        fields:
          'name,account_id,account_status,currency,timezone_name,amount_spent,balance,spend_cap,business_name',
      },
    });

    return {
      ...data,
      isConnected: true,
    };
  }

  // ──────────────── Campaigns ────────────────

  async getCampaigns(page = 1, limit = 20) {
    this.ensureConfigured();

    const { data } = await this.client.get(`/${this.adAccountId}/campaigns`, {
      params: {
        fields:
          'id,name,objective,status,daily_budget,lifetime_budget,start_time,stop_time,created_time,updated_time',
        limit,
        offset: (page - 1) * limit,
      },
    });

    const campaigns = data.data || [];

    // Fetch insights for each campaign
    const campaignsWithInsights = await Promise.all(
      campaigns.map(async (campaign: any) => {
        try {
          const { data: insightsData } = await this.client.get(
            `/${campaign.id}/insights`,
            {
              params: {
                fields: 'impressions,clicks,spend,ctr,reach,conversions',
                date_preset: 'last_30d',
              },
            }
          );
          return {
            ...campaign,
            insights: insightsData.data?.[0] || null,
          };
        } catch {
          return { ...campaign, insights: null };
        }
      })
    );

    return {
      campaigns: campaignsWithInsights,
      paging: data.paging || null,
    };
  }

  async createCampaign(data: {
    name: string;
    objective: string;
    dailyBudget: number;
    startTime?: string;
    endTime?: string;
    status?: string;
  }) {
    this.ensureConfigured();

    const payload: Record<string, any> = {
      name: data.name,
      objective: data.objective,
      daily_budget: Math.round(data.dailyBudget * 100), // Convert to paisa/cents
      special_ad_categories: [],
      status: data.status || 'PAUSED',
    };

    if (data.startTime) payload.start_time = data.startTime;
    if (data.endTime) payload.stop_time = data.endTime;

    const response = await this.client.post(
      `/${this.adAccountId}/campaigns`,
      payload
    );

    return response.data;
  }

  async updateCampaign(
    campaignId: string,
    data: Partial<{
      name: string;
      objective: string;
      dailyBudget: number;
      status: string;
      startTime: string;
      endTime: string;
    }>
  ) {
    this.ensureConfigured();

    const payload: Record<string, any> = {};
    if (data.name) payload.name = data.name;
    if (data.dailyBudget)
      payload.daily_budget = Math.round(data.dailyBudget * 100);
    if (data.status) payload.status = data.status;
    if (data.startTime) payload.start_time = data.startTime;
    if (data.endTime) payload.stop_time = data.endTime;

    const response = await this.client.post(`/${campaignId}`, payload);
    return response.data;
  }

  async pauseCampaign(campaignId: string) {
    this.ensureConfigured();
    const response = await this.client.post(`/${campaignId}`, {
      status: 'PAUSED',
    });
    return response.data;
  }

  async resumeCampaign(campaignId: string) {
    this.ensureConfigured();
    const response = await this.client.post(`/${campaignId}`, {
      status: 'ACTIVE',
    });
    return response.data;
  }

  async deleteCampaign(campaignId: string) {
    this.ensureConfigured();
    const response = await this.client.delete(`/${campaignId}`);
    return response.data;
  }

  // ──────────────── Ad Sets ────────────────

  async getAdSets(campaignId: string) {
    this.ensureConfigured();

    const { data } = await this.client.get(`/${campaignId}/adsets`, {
      params: {
        fields:
          'id,name,status,daily_budget,targeting,optimization_goal,billing_event,bid_amount,start_time,end_time,created_time',
      },
    });

    return data.data || [];
  }

  async createAdSet(
    campaignId: string,
    data: {
      name: string;
      targeting: {
        age_min?: number;
        age_max?: number;
        genders?: number[];
        geo_locations?: {
          countries?: string[];
          cities?: { key: string; name?: string }[];
        };
        interests?: { id: string; name: string }[];
      };
      optimization_goal?: string;
      billing_event?: string;
      bid_amount?: number;
      dailyBudget: number;
      startTime?: string;
      endTime?: string;
    }
  ) {
    this.ensureConfigured();

    const targeting: Record<string, any> = {};
    if (data.targeting.age_min) targeting.age_min = data.targeting.age_min;
    if (data.targeting.age_max) targeting.age_max = data.targeting.age_max;
    if (data.targeting.genders) targeting.genders = data.targeting.genders;
    if (data.targeting.geo_locations)
      targeting.geo_locations = data.targeting.geo_locations;
    if (data.targeting.interests) {
      targeting.flexible_spec = [{ interests: data.targeting.interests }];
    }

    const payload: Record<string, any> = {
      name: data.name,
      campaign_id: campaignId,
      daily_budget: Math.round(data.dailyBudget * 100),
      targeting,
      optimization_goal: data.optimization_goal || 'REACH',
      billing_event: data.billing_event || 'IMPRESSIONS',
      status: 'PAUSED',
    };

    if (data.bid_amount) payload.bid_amount = Math.round(data.bid_amount * 100);
    if (data.startTime) payload.start_time = data.startTime;
    if (data.endTime) payload.end_time = data.endTime;

    const response = await this.client.post(
      `/${this.adAccountId}/adsets`,
      payload
    );

    return response.data;
  }

  // ──────────────── Ads ────────────────

  async getAds(adSetId: string) {
    this.ensureConfigured();

    const { data } = await this.client.get(`/${adSetId}/ads`, {
      params: {
        fields:
          'id,name,status,creative{id,title,body,image_url,object_story_spec},created_time',
      },
    });

    return data.data || [];
  }

  async createAd(
    adSetId: string,
    data: {
      name: string;
      creative: {
        title: string;
        body: string;
        imageUrl: string;
        link: string;
        callToAction: string;
      };
      placements?: string[];
    }
  ) {
    this.ensureConfigured();

    // First, create the ad creative
    const creativePayload: Record<string, any> = {
      name: `Creative - ${data.name}`,
      object_story_spec: {
        page_id: config.META_APP_ID,
        link_data: {
          message: data.creative.body,
          link: data.creative.link,
          name: data.creative.title,
          image_url: data.creative.imageUrl,
          call_to_action: {
            type: data.creative.callToAction || 'SHOP_NOW',
          },
        },
      },
    };

    const creativeResponse = await this.client.post(
      `/${this.adAccountId}/adcreatives`,
      creativePayload
    );

    // Then, create the ad
    const adPayload: Record<string, any> = {
      name: data.name,
      adset_id: adSetId,
      creative: { creative_id: creativeResponse.data.id },
      status: 'PAUSED',
    };

    const response = await this.client.post(
      `/${this.adAccountId}/ads`,
      adPayload
    );

    return response.data;
  }

  // ──────────────── Insights ────────────────

  async getAdInsights(
    adId: string,
    dateRange?: { since: string; until: string }
  ) {
    this.ensureConfigured();

    const params: Record<string, any> = {
      fields:
        'impressions,reach,clicks,spend,cpc,cpm,ctr,conversions,cost_per_action_type,actions',
    };

    if (dateRange) {
      params.time_range = JSON.stringify({
        since: dateRange.since,
        until: dateRange.until,
      });
    } else {
      params.date_preset = 'last_30d';
    }

    const { data } = await this.client.get(`/${adId}/insights`, { params });
    return data.data?.[0] || null;
  }

  async getCampaignInsights(
    campaignId: string,
    dateRange?: { since: string; until: string }
  ) {
    this.ensureConfigured();

    const params: Record<string, any> = {
      fields:
        'impressions,reach,clicks,spend,cpc,cpm,ctr,conversions,cost_per_action_type,actions,frequency',
      time_increment: 1, // Daily breakdown
    };

    if (dateRange) {
      params.time_range = JSON.stringify({
        since: dateRange.since,
        until: dateRange.until,
      });
    } else {
      params.date_preset = 'last_30d';
    }

    const { data } = await this.client.get(`/${campaignId}/insights`, {
      params,
    });
    return data.data || [];
  }

  async getAccountInsights(dateRange?: { since: string; until: string }) {
    this.ensureConfigured();

    const params: Record<string, any> = {
      fields:
        'impressions,reach,clicks,spend,cpc,cpm,ctr,conversions,cost_per_action_type,actions',
    };

    if (dateRange) {
      params.time_range = JSON.stringify({
        since: dateRange.since,
        until: dateRange.until,
      });
    } else {
      params.date_preset = 'last_30d';
    }

    const { data } = await this.client.get(`/${this.adAccountId}/insights`, {
      params,
    });

    return data.data?.[0] || null;
  }

  // ──────────────── Product Catalog Sync ────────────────

  async syncProductCatalog() {
    this.ensureConfigured();

    // Fetch all active products from DB
    const products = await prisma.product.findMany({
      where: { isActive: true },
      include: {
        images: true,
        category: true,
      },
    });

    // Get or create product catalog
    let catalogId: string;
    try {
      const { data: catalogs } = await this.client.get(
        `/${this.adAccountId}/product_catalogs`,
        { params: { fields: 'id,name' } }
      );

      if (catalogs.data && catalogs.data.length > 0) {
        catalogId = catalogs.data[0].id;
      } else {
        const { data: newCatalog } = await this.client.post(
          `/${this.adAccountId}/product_catalogs`,
          { name: 'Jewelup Products' }
        );
        catalogId = newCatalog.id;
      }
    } catch {
      throw new AppError(
        'Failed to access Meta Product Catalog. Check permissions.',
        500
      );
    }

    // Sync products to catalog
    let synced = 0;
    let failed = 0;

    for (const product of products) {
      try {
        const imageUrl =
          product.images?.[0]?.url || product.images?.[0]?.src || '';
        const productData = {
          retailer_id: product.id,
          name: product.name,
          description: product.description || product.name,
          availability: 'in stock',
          url: `${config.FRONTEND_URL}/products/${product.slug}`,
          image_url: imageUrl,
          price: `${product.price || 0} INR`,
          brand: 'Jewelup by Sarita',
          category: (product as any).category?.name || 'Jewellery',
        };

        await this.client.post(`/${catalogId}/products`, productData);
        synced++;
      } catch {
        failed++;
      }
    }

    return {
      total: products.length,
      synced,
      failed,
      catalogId,
    };
  }

  // ──────────────── Audiences ────────────────

  async getAudiences() {
    this.ensureConfigured();

    const { data } = await this.client.get(
      `/${this.adAccountId}/customaudiences`,
      {
        params: {
          fields:
            'id,name,description,approximate_count,subtype,time_created,time_updated',
        },
      }
    );

    return data.data || [];
  }
}

export const metaAdsService = new MetaAdsService();
