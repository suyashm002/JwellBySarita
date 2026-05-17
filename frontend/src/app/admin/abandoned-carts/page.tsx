'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ShoppingBag,
  RotateCcw,
  IndianRupee,
  TrendingUp,
  Mail,
  MessageSquare,
  Phone,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { StatsCard } from '@/components/admin/StatsCard';
import { AbandonedCartTable, AbandonedCart } from '@/components/admin/AbandonedCartTable';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface RecoveryMetrics {
  totalAbandoned: number;
  totalRecovered: number;
  recoveryRate: number;
  revenueRecovered: number;
  byChannel: { channel: string; count: number; revenue: number }[];
}

export default function AbandonedCartsPage() {
  const [metrics, setMetrics] = useState<RecoveryMetrics | null>(null);
  const [carts, setCarts] = useState<AbandonedCart[]>([]);
  const [loading, setLoading] = useState(true);
  const [outreachDialog, setOutreachDialog] = useState(false);
  const [selectedCartId, setSelectedCartId] = useState('');
  const [outreachChannel, setOutreachChannel] = useState('email');
  const [outreachMessage, setOutreachMessage] = useState('');
  const [sending, setSending] = useState(false);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [metricsRes, cartsRes] = await Promise.all([
        adminAPI.getRecoveryMetrics(30),
        adminAPI.getAbandonedCarts(),
      ]);
      setMetrics(metricsRes.data.data);
      setCarts(cartsRes.data.data || []);
    } catch (err) {
      console.error('Failed to load abandoned carts:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSendOutreach = (cartId: string, channel: string) => {
    setSelectedCartId(cartId);
    setOutreachChannel(channel);
    setOutreachMessage('');
    setOutreachDialog(true);
  };

  const handleOutreachSubmit = async () => {
    try {
      setSending(true);
      await adminAPI.sendOutreach(selectedCartId, {
        channel: outreachChannel,
        message: outreachMessage,
      });
      toast.success('Outreach sent successfully');
      setOutreachDialog(false);
      loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to send outreach');
    } finally {
      setSending(false);
    }
  };

  const channelChartData = metrics?.byChannel?.map((c) => ({
    channel: c.channel,
    recovered: c.count,
    revenue: c.revenue,
  })) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Abandoned Cart Recovery</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Abandoned Cart Recovery</h1>

      {/* Metrics Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Abandoned"
          value={metrics?.totalAbandoned?.toLocaleString('en-IN') || '0'}
          icon={ShoppingBag}
          color="red"
        />
        <StatsCard
          title="Recovered"
          value={metrics?.totalRecovered?.toLocaleString('en-IN') || '0'}
          icon={RotateCcw}
          color="green"
        />
        <StatsCard
          title="Recovery Rate"
          value={`${parseFloat(metrics?.recoveryRate || '0')}%`}
          icon={TrendingUp}
          color="blue"
        />
        <StatsCard
          title="Revenue Recovered"
          value={formatCurrency(metrics?.revenueRecovered || 0)}
          icon={IndianRupee}
          color="green"
        />
      </div>

      {/* Recovery by Channel Chart */}
      {channelChartData.length > 0 && (
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Recovery by Channel</h3>
          </CardHeader>
          <CardBody>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={channelChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="channel" tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                  />
                  <Bar dataKey="recovered" fill="#722F37" radius={[4, 4, 0, 0]} name="Recoveries" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Abandoned Carts Table */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">All Abandoned Carts</h3>
        </CardHeader>
        <CardBody className="p-0">
          <AbandonedCartTable carts={carts} onSendOutreach={handleSendOutreach} />
        </CardBody>
      </Card>

      {/* Manual Outreach Dialog */}
      <Dialog
        isOpen={outreachDialog}
        onClose={() => setOutreachDialog(false)}
        title="Send Manual Outreach"
      >
        <div className="space-y-4">
          <Select
            label="Channel"
            options={[
              { value: 'email', label: 'Email' },
              { value: 'sms', label: 'SMS' },
              { value: 'whatsapp', label: 'WhatsApp' },
            ]}
            value={outreachChannel}
            onChange={(e) => setOutreachChannel(e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-gray-700">Message (optional)</label>
            <textarea
              value={outreachMessage}
              onChange={(e) => setOutreachMessage(e.target.value)}
              rows={4}
              placeholder="Custom message to send..."
              className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20"
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setOutreachDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleOutreachSubmit} loading={sending}>
              Send
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
