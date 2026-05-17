'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Megaphone,
  Plus,
  Pause,
  Play,
  Trash2,
  Eye,
  RefreshCw,
  ChevronDown,
  ChevronRight,
  Upload,
  ArrowLeft,
  ArrowRight,
  X as XIcon,
  MousePointerClick,
  DollarSign,
  BarChart3,
  Users,
  TrendingUp,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { adminAPI } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Select } from '@/components/ui/select';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { useRequireAdmin } from '@/hooks/useAuth';
import { formatCurrency } from '@/lib/utils';

// ──────────────── Types ────────────────

interface Campaign {
  id: string;
  name: string;
  objective: string;
  status: string;
  daily_budget: string;
  start_time?: string;
  stop_time?: string;
  created_time?: string;
  insights?: {
    impressions?: string;
    clicks?: string;
    spend?: string;
    ctr?: string;
    reach?: string;
  } | null;
}

interface AdSet {
  id: string;
  name: string;
  status: string;
  daily_budget: string;
  targeting?: any;
}

interface Ad {
  id: string;
  name: string;
  status: string;
  creative?: any;
}

interface AccountInsights {
  impressions?: string;
  clicks?: string;
  spend?: string;
  ctr?: string;
  conversions?: string;
  reach?: string;
}

// ──────────────── Constants ────────────────

const OBJECTIVES = [
  { value: 'OUTCOME_AWARENESS', label: 'Brand Awareness' },
  { value: 'OUTCOME_TRAFFIC', label: 'Traffic' },
  { value: 'OUTCOME_ENGAGEMENT', label: 'Engagement' },
  { value: 'OUTCOME_SALES', label: 'Sales' },
];

const CTA_OPTIONS = [
  { value: 'SHOP_NOW', label: 'Shop Now' },
  { value: 'LEARN_MORE', label: 'Learn More' },
  { value: 'BUY_NOW', label: 'Buy Now' },
];

const DATE_PRESETS = [
  { value: 'last_7d', label: 'Last 7 days', since: 7 },
  { value: 'last_30d', label: 'Last 30 days', since: 30 },
  { value: 'last_90d', label: 'Last 90 days', since: 90 },
];

const PLACEMENTS = [
  { id: 'facebook_feed', label: 'Facebook Feed' },
  { id: 'instagram_feed', label: 'Instagram Feed' },
  { id: 'instagram_stories', label: 'Instagram Stories' },
  { id: 'instagram_reels', label: 'Instagram Reels' },
];

// ──────────────── Facebook & Instagram SVG Icons ────────────────

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
    </svg>
  );
}

// ──────────────── Helper ────────────────

function getStatusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return <Badge variant="success">Active</Badge>;
    case 'PAUSED':
      return <Badge variant="warning">Paused</Badge>;
    case 'ARCHIVED':
      return <Badge variant="danger">Archived</Badge>;
    case 'DELETED':
      return <Badge variant="danger">Deleted</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
}

function getObjectiveLabel(objective: string) {
  return OBJECTIVES.find((o) => o.value === objective)?.label || objective;
}

function formatBudget(budget: string | number) {
  const num = typeof budget === 'string' ? parseInt(budget) : budget;
  return formatCurrency(num / 100); // Convert from paisa to INR
}

function getDateRange(preset: string) {
  const now = new Date();
  const days = DATE_PRESETS.find((d) => d.value === preset)?.since || 30;
  const since = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
  return {
    since: since.toISOString().split('T')[0],
    until: now.toISOString().split('T')[0],
  };
}

// ──────────────── Main Component ────────────────

export default function MetaAdsPage() {
  const { isLoading: authLoading } = useRequireAdmin();

  // Data state
  const [account, setAccount] = useState<any>(null);
  const [accountConnected, setAccountConnected] = useState(false);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [insights, setInsights] = useState<AccountInsights | null>(null);
  const [expandedCampaign, setExpandedCampaign] = useState<string | null>(null);
  const [adSets, setAdSets] = useState<Record<string, AdSet[]>>({});
  const [ads, setAds] = useState<Record<string, Ad[]>>({});

  // UI state
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [datePreset, setDatePreset] = useState('last_30d');
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [createStep, setCreateStep] = useState(1);

  // Create campaign form state
  const [formData, setFormData] = useState({
    // Step 1: Campaign
    name: '',
    objective: 'OUTCOME_TRAFFIC',
    dailyBudget: '',
    // Step 2: Targeting
    ageMin: '18',
    ageMax: '65',
    gender: '0', // 0 = all, 1 = male, 2 = female
    locations: '',
    interests: '',
    // Step 3: Placements
    placements: ['facebook_feed', 'instagram_feed'] as string[],
    // Step 4: Ad Creative
    adName: '',
    title: '',
    body: '',
    imageUrl: '',
    link: '',
    callToAction: 'SHOP_NOW',
  });

  // ──────────────── Data Fetching ────────────────

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch account info
      try {
        const accountRes = await adminAPI.getMetaAccount();
        setAccount(accountRes.data.data);
        setAccountConnected(true);
      } catch {
        setAccountConnected(false);
      }

      // Fetch campaigns
      try {
        const campaignsRes = await adminAPI.getMetaCampaigns();
        setCampaigns(campaignsRes.data.data?.campaigns || []);
      } catch {
        setCampaigns([]);
      }

      // Fetch account insights
      try {
        const dateRange = getDateRange(datePreset);
        const insightsRes = await adminAPI.getMetaInsights(dateRange);
        setInsights(insightsRes.data.data);
      } catch {
        setInsights(null);
      }
    } finally {
      setLoading(false);
    }
  }, [datePreset]);

  useEffect(() => {
    if (!authLoading) {
      fetchData();
    }
  }, [authLoading, fetchData]);

  // ──────────────── Campaign Actions ────────────────

  const handlePause = async (campaignId: string) => {
    try {
      await adminAPI.pauseMetaCampaign(campaignId);
      toast.success('Campaign paused');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to pause campaign');
    }
  };

  const handleResume = async (campaignId: string) => {
    try {
      await adminAPI.resumeMetaCampaign(campaignId);
      toast.success('Campaign resumed');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to resume campaign');
    }
  };

  const handleDelete = async (campaignId: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await adminAPI.deleteMetaCampaign(campaignId);
      toast.success('Campaign deleted');
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to delete campaign');
    }
  };

  const handleSyncCatalog = async () => {
    setSyncing(true);
    try {
      const res = await adminAPI.syncMetaCatalog();
      const result = res.data.data;
      toast.success(
        `Catalog synced: ${result.synced} products synced, ${result.failed} failed`
      );
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to sync catalog');
    } finally {
      setSyncing(false);
    }
  };

  // ──────────────── Expand Campaign (Ad Sets & Ads) ────────────────

  const toggleExpandCampaign = async (campaignId: string) => {
    if (expandedCampaign === campaignId) {
      setExpandedCampaign(null);
      return;
    }

    setExpandedCampaign(campaignId);

    if (!adSets[campaignId]) {
      try {
        const res = await adminAPI.getMetaAdSets(campaignId);
        setAdSets((prev) => ({ ...prev, [campaignId]: res.data.data || [] }));

        // Fetch ads for each ad set
        const sets = res.data.data || [];
        for (const adSet of sets) {
          try {
            const adsRes = await adminAPI.getMetaAds(adSet.id);
            setAds((prev) => ({ ...prev, [adSet.id]: adsRes.data.data || [] }));
          } catch {
            // Ignore individual ad set errors
          }
        }
      } catch {
        toast.error('Failed to load ad sets');
      }
    }
  };

  // ──────────────── Create Campaign Flow ────────────────

  const handleCreateCampaign = async () => {
    try {
      // Step 1: Create Campaign
      const campaignRes = await adminAPI.createMetaCampaign({
        name: formData.name,
        objective: formData.objective,
        dailyBudget: parseFloat(formData.dailyBudget),
        status: 'PAUSED',
      });

      const campaignId = campaignRes.data.data?.id;
      if (!campaignId) {
        toast.error('Failed to create campaign');
        return;
      }

      // Step 2: Create Ad Set
      const genders =
        formData.gender === '0'
          ? [1, 2]
          : [parseInt(formData.gender)];

      const targeting: any = {
        age_min: parseInt(formData.ageMin),
        age_max: parseInt(formData.ageMax),
        genders,
        geo_locations: {
          countries: ['IN'],
        },
      };

      if (formData.locations.trim()) {
        targeting.geo_locations.cities = formData.locations
          .split(',')
          .map((c) => ({ key: c.trim(), name: c.trim() }));
      }

      if (formData.interests.trim()) {
        targeting.interests = formData.interests
          .split(',')
          .map((i, idx) => ({ id: String(idx), name: i.trim() }));
      }

      const adSetRes = await adminAPI.createMetaAdSet(campaignId, {
        name: `${formData.name} - Ad Set`,
        targeting,
        dailyBudget: parseFloat(formData.dailyBudget),
        optimization_goal: 'REACH',
        billing_event: 'IMPRESSIONS',
      });

      const adSetId = adSetRes.data.data?.id;
      if (!adSetId) {
        toast.success('Campaign created but ad set creation failed');
        setShowCreateDialog(false);
        fetchData();
        return;
      }

      // Step 3: Create Ad
      if (formData.adName && formData.title) {
        await adminAPI.createMetaAd(adSetId, {
          name: formData.adName || `${formData.name} - Ad`,
          creative: {
            title: formData.title,
            body: formData.body,
            imageUrl: formData.imageUrl,
            link: formData.link,
            callToAction: formData.callToAction,
          },
          placements: formData.placements,
        });
      }

      toast.success('Campaign created successfully');
      setShowCreateDialog(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      toast.error(
        err.response?.data?.message || 'Failed to create campaign'
      );
    }
  };

  const resetForm = () => {
    setCreateStep(1);
    setFormData({
      name: '',
      objective: 'OUTCOME_TRAFFIC',
      dailyBudget: '',
      ageMin: '18',
      ageMax: '65',
      gender: '0',
      locations: '',
      interests: '',
      placements: ['facebook_feed', 'instagram_feed'],
      adName: '',
      title: '',
      body: '',
      imageUrl: '',
      link: '',
      callToAction: 'SHOP_NOW',
    });
  };

  const togglePlacement = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      placements: prev.placements.includes(id)
        ? prev.placements.filter((p) => p !== id)
        : [...prev.placements, id],
    }));
  };

  // ──────────────── Render ────────────────

  if (authLoading || loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#722F37]" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#722F37]/10">
            <Megaphone className="h-5 w-5 text-[#722F37]" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Meta Ads Manager
            </h1>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <FacebookIcon className="h-4 w-4 text-blue-600" />
              <span>Facebook</span>
              <span className="text-gray-300">|</span>
              <InstagramIcon className="h-4 w-4 text-pink-600" />
              <span>Instagram</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Select
            options={DATE_PRESETS.map((d) => ({ value: d.value, label: d.label }))}
            value={datePreset}
            onChange={(e) => setDatePreset(e.target.value)}
            className="w-40"
          />
          <Button
            variant="secondary"
            size="sm"
            onClick={handleSyncCatalog}
            loading={syncing}
          >
            <Upload className="h-4 w-4" />
            Sync Catalog
          </Button>
          <Button
            size="sm"
            onClick={() => {
              resetForm();
              setShowCreateDialog(true);
            }}
          >
            <Plus className="h-4 w-4" />
            Create Campaign
          </Button>
        </div>
      </div>

      {/* Account Status */}
      <Card>
        <CardBody>
          <div className="flex items-center gap-3">
            {accountConnected ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Connected to Meta Ads
                  </p>
                  <p className="text-xs text-gray-500">
                    {account?.name || account?.business_name || 'Ad Account'}{' '}
                    ({account?.account_id || 'N/A'})
                  </p>
                </div>
              </>
            ) : (
              <>
                <AlertCircle className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Not Connected
                  </p>
                  <p className="text-xs text-gray-500">
                    Configure META_ACCESS_TOKEN and META_AD_ACCOUNT_ID in your
                    environment variables to connect.
                  </p>
                </div>
              </>
            )}
          </div>
        </CardBody>
      </Card>

      {/* Overview Metrics */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <DollarSign className="h-4 w-4" />
              <span>Total Spend</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {insights?.spend ? formatCurrency(parseFloat(insights.spend)) : '--'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Eye className="h-4 w-4" />
              <span>Impressions</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {insights?.impressions
                ? parseInt(insights.impressions).toLocaleString('en-IN')
                : '--'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <MousePointerClick className="h-4 w-4" />
              <span>Clicks</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {insights?.clicks
                ? parseInt(insights.clicks).toLocaleString('en-IN')
                : '--'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <TrendingUp className="h-4 w-4" />
              <span>CTR</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {insights?.ctr
                ? `${parseFloat(insights.ctr).toFixed(2)}%`
                : '--'}
            </p>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Users className="h-4 w-4" />
              <span>Reach</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {insights?.reach
                ? parseInt(insights.reach).toLocaleString('en-IN')
                : '--'}
            </p>
          </CardBody>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Campaigns</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={fetchData}
            >
              <RefreshCw className="h-4 w-4" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        {campaigns.length === 0 ? (
          <CardBody>
            <div className="py-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500">
                No campaigns yet. Create your first campaign to get started.
              </p>
              <Button
                className="mt-4"
                size="sm"
                onClick={() => {
                  resetForm();
                  setShowCreateDialog(true);
                }}
              >
                <Plus className="h-4 w-4" />
                Create Campaign
              </Button>
            </div>
          </CardBody>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead></TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Objective</TableHead>
                <TableHead>Budget</TableHead>
                <TableHead>Spend</TableHead>
                <TableHead>Impressions</TableHead>
                <TableHead>Clicks</TableHead>
                <TableHead>CTR</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {campaigns.map((campaign) => (
                <React.Fragment key={campaign.id}>
                  <TableRow>
                    <TableCell>
                      <button
                        onClick={() => toggleExpandCampaign(campaign.id)}
                        className="p-1 text-gray-400 hover:text-gray-600"
                      >
                        {expandedCampaign === campaign.id ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                      </button>
                    </TableCell>
                    <TableCell className="font-medium">
                      {campaign.name}
                    </TableCell>
                    <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                    <TableCell className="text-xs">
                      {getObjectiveLabel(campaign.objective)}
                    </TableCell>
                    <TableCell>
                      {campaign.daily_budget
                        ? formatBudget(campaign.daily_budget)
                        : '--'}
                      <span className="text-xs text-gray-400">/day</span>
                    </TableCell>
                    <TableCell>
                      {campaign.insights?.spend
                        ? formatCurrency(parseFloat(campaign.insights.spend))
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {campaign.insights?.impressions
                        ? parseInt(campaign.insights.impressions).toLocaleString('en-IN')
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {campaign.insights?.clicks
                        ? parseInt(campaign.insights.clicks).toLocaleString('en-IN')
                        : '--'}
                    </TableCell>
                    <TableCell>
                      {campaign.insights?.ctr
                        ? `${parseFloat(campaign.insights.ctr).toFixed(2)}%`
                        : '--'}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {campaign.status === 'ACTIVE' ? (
                          <button
                            onClick={() => handlePause(campaign.id)}
                            className="rounded p-1 text-amber-600 hover:bg-amber-50"
                            title="Pause"
                          >
                            <Pause className="h-4 w-4" />
                          </button>
                        ) : campaign.status === 'PAUSED' ? (
                          <button
                            onClick={() => handleResume(campaign.id)}
                            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
                            title="Resume"
                          >
                            <Play className="h-4 w-4" />
                          </button>
                        ) : null}
                        <button
                          onClick={() => handleDelete(campaign.id)}
                          className="rounded p-1 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>

                  {/* Expanded Ad Sets & Ads */}
                  {expandedCampaign === campaign.id && (
                    <TableRow>
                      <TableCell colSpan={10} className="bg-gray-50 p-0">
                        <div className="p-4">
                          <h4 className="mb-2 text-sm font-semibold text-gray-700">
                            Ad Sets
                          </h4>
                          {!adSets[campaign.id] ? (
                            <div className="flex items-center gap-2 text-sm text-gray-500">
                              <Loader2 className="h-4 w-4 animate-spin" />
                              Loading...
                            </div>
                          ) : adSets[campaign.id].length === 0 ? (
                            <p className="text-sm text-gray-500">
                              No ad sets in this campaign.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {adSets[campaign.id].map((adSet) => (
                                <div
                                  key={adSet.id}
                                  className="rounded-lg border border-gray-200 bg-white p-3"
                                >
                                  <div className="flex items-center justify-between">
                                    <div>
                                      <p className="text-sm font-medium text-gray-900">
                                        {adSet.name}
                                      </p>
                                      <p className="text-xs text-gray-500">
                                        Budget:{' '}
                                        {adSet.daily_budget
                                          ? formatBudget(adSet.daily_budget)
                                          : 'N/A'}
                                        /day
                                      </p>
                                    </div>
                                    {getStatusBadge(adSet.status)}
                                  </div>

                                  {/* Ads within Ad Set */}
                                  {ads[adSet.id] && ads[adSet.id].length > 0 && (
                                    <div className="mt-2 border-t border-gray-100 pt-2">
                                      <p className="mb-1 text-xs font-semibold text-gray-500">
                                        Ads
                                      </p>
                                      {ads[adSet.id].map((ad) => (
                                        <div
                                          key={ad.id}
                                          className="flex items-center justify-between py-1 text-xs"
                                        >
                                          <span className="text-gray-700">
                                            {ad.name}
                                          </span>
                                          {getStatusBadge(ad.status)}
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  )}
                </React.Fragment>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>

      {/* ──────────────── Create Campaign Dialog ──────────────── */}
      <Dialog
        isOpen={showCreateDialog}
        onClose={() => setShowCreateDialog(false)}
        title={`Create Campaign - Step ${createStep} of 4`}
        className="max-w-2xl"
      >
        <div className="space-y-4">
          {/* Step indicator */}
          <div className="flex items-center gap-2">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold ${
                    step === createStep
                      ? 'bg-[#722F37] text-white'
                      : step < createStep
                      ? 'bg-emerald-500 text-white'
                      : 'bg-gray-200 text-gray-500'
                  }`}
                >
                  {step < createStep ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    step
                  )}
                </div>
                {step < 4 && (
                  <div
                    className={`h-0.5 w-8 ${
                      step < createStep ? 'bg-emerald-500' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Step 1: Campaign Details */}
          {createStep === 1 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Campaign Details
              </h3>
              <Input
                label="Campaign Name"
                value={formData.name}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, name: e.target.value }))
                }
                placeholder="e.g., Summer Silver Collection"
              />
              <Select
                label="Objective"
                options={OBJECTIVES}
                value={formData.objective}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, objective: e.target.value }))
                }
              />
              <Input
                label="Daily Budget (INR)"
                type="number"
                value={formData.dailyBudget}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, dailyBudget: e.target.value }))
                }
                placeholder="e.g., 500"
              />
            </div>
          )}

          {/* Step 2: Targeting */}
          {createStep === 2 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Audience Targeting
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Min Age"
                  type="number"
                  value={formData.ageMin}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, ageMin: e.target.value }))
                  }
                  min="18"
                  max="65"
                />
                <Input
                  label="Max Age"
                  type="number"
                  value={formData.ageMax}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, ageMax: e.target.value }))
                  }
                  min="18"
                  max="65"
                />
              </div>
              <Select
                label="Gender"
                options={[
                  { value: '0', label: 'All' },
                  { value: '1', label: 'Male' },
                  { value: '2', label: 'Female' },
                ]}
                value={formData.gender}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, gender: e.target.value }))
                }
              />
              <Input
                label="Locations (cities, comma-separated)"
                value={formData.locations}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, locations: e.target.value }))
                }
                placeholder="e.g., Mumbai, Delhi, Bangalore"
              />
              <Input
                label="Interests (comma-separated)"
                value={formData.interests}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, interests: e.target.value }))
                }
                placeholder="e.g., Jewellery, Fashion, Silver"
              />
            </div>
          )}

          {/* Step 3: Placements */}
          {createStep === 3 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Platform Placements
              </h3>
              <p className="text-xs text-gray-500">
                Select where your ads will appear.
              </p>
              <div className="space-y-2">
                {PLACEMENTS.map((placement) => (
                  <label
                    key={placement.id}
                    className="flex cursor-pointer items-center gap-3 rounded-lg border border-gray-200 p-3 transition-colors hover:bg-gray-50"
                  >
                    <input
                      type="checkbox"
                      checked={formData.placements.includes(placement.id)}
                      onChange={() => togglePlacement(placement.id)}
                      className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#722F37]"
                    />
                    <div className="flex items-center gap-2">
                      {placement.id.startsWith('facebook') ? (
                        <FacebookIcon className="h-4 w-4 text-blue-600" />
                      ) : (
                        <InstagramIcon className="h-4 w-4 text-pink-600" />
                      )}
                      <span className="text-sm font-medium text-gray-700">
                        {placement.label}
                      </span>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* Step 4: Ad Creative */}
          {createStep === 4 && (
            <div className="space-y-4">
              <h3 className="text-sm font-semibold text-gray-700">
                Ad Creative
              </h3>
              <Input
                label="Ad Name"
                value={formData.adName}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, adName: e.target.value }))
                }
                placeholder="e.g., Silver Ring Ad"
              />
              <Input
                label="Headline"
                value={formData.title}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, title: e.target.value }))
                }
                placeholder="e.g., Handcrafted Silver Jewellery"
              />
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-gray-700">
                  Body Text
                </label>
                <textarea
                  value={formData.body}
                  onChange={(e) =>
                    setFormData((f) => ({ ...f, body: e.target.value }))
                  }
                  placeholder="Describe your product or offer..."
                  rows={3}
                  className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors duration-200 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20"
                />
              </div>
              <Input
                label="Image URL"
                value={formData.imageUrl}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, imageUrl: e.target.value }))
                }
                placeholder="https://..."
              />
              <Input
                label="Destination URL"
                value={formData.link}
                onChange={(e) =>
                  setFormData((f) => ({ ...f, link: e.target.value }))
                }
                placeholder="https://jewelupbysarita.com/..."
              />
              <Select
                label="Call to Action"
                options={CTA_OPTIONS}
                value={formData.callToAction}
                onChange={(e) =>
                  setFormData((f) => ({
                    ...f,
                    callToAction: e.target.value,
                  }))
                }
              />
            </div>
          )}

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between border-t border-gray-100 pt-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                if (createStep === 1) {
                  setShowCreateDialog(false);
                } else {
                  setCreateStep((s) => s - 1);
                }
              }}
            >
              <ArrowLeft className="h-4 w-4" />
              {createStep === 1 ? 'Cancel' : 'Back'}
            </Button>

            {createStep < 4 ? (
              <Button
                size="sm"
                onClick={() => setCreateStep((s) => s + 1)}
                disabled={
                  createStep === 1 && (!formData.name || !formData.dailyBudget)
                }
              >
                Next
                <ArrowRight className="h-4 w-4" />
              </Button>
            ) : (
              <Button size="sm" onClick={handleCreateCampaign}>
                Create Campaign
              </Button>
            )}
          </div>
        </div>
      </Dialog>
    </div>
  );
}
