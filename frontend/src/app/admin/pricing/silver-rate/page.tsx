'use client';

import React, { useEffect, useState } from 'react';
import {
  RefreshCw,
  Wifi,
  WifiOff,
  Clock,
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { pricingAPI, adminAPI } from '@/lib/api';
import { SilverRate, SilverRateHistory } from '@/types/pricing';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function SilverRatePage() {
  const [rate, setRate] = useState<SilverRate | null>(null);
  const [history, setHistory] = useState<SilverRateHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [bufferPercent, setBufferPercent] = useState(0);
  const [manualRate, setManualRate] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [rateRes, historyRes] = await Promise.all([
        pricingAPI.getSilverRate(),
        adminAPI.getSilverRateHistory(),
      ]);
      const rateData = rateRes.data.data;
      setRate(rateData);
      setBufferPercent(rateData.bufferPercent || 0);
      setHistory(historyRes.data.data || []);
    } catch (err) {
      console.error('Failed to load silver rate:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleBufferUpdate = async () => {
    try {
      setSubmitting(true);
      await adminAPI.updateBuffer(bufferPercent);
      toast.success('Buffer percentage updated');
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update buffer');
    } finally {
      setSubmitting(false);
    }
  };

  const handleManualOverride = async () => {
    const rateValue = parseFloat(manualRate);
    if (isNaN(rateValue) || rateValue <= 0) {
      toast.error('Enter a valid rate');
      return;
    }
    try {
      setSubmitting(true);
      await adminAPI.overrideSilverRate({ ratePerGram: rateValue });
      toast.success('Silver rate overridden');
      setManualRate('');
      await loadData();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to override rate');
    } finally {
      setSubmitting(false);
    }
  };

  const chartData = history.map((h) => ({
    time: new Date(h.createdAt).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
    }),
    rate: h.effectiveRate,
  }));

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Silver Rate Management</h1>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
        <Skeleton className="h-96 rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Silver Rate Management</h1>
        <Button variant="secondary" onClick={loadData}>
          <RefreshCw className="h-4 w-4" />
          Refresh
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Current Rate */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">Current Silver Rate</h3>
              <Badge variant={rate?.source === 'API' ? 'success' : rate?.source === 'MANUAL' ? 'warning' : 'info'}>
                {rate?.source || 'Unknown'}
              </Badge>
            </div>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Effective Rate (with buffer)</p>
              <p className="text-4xl font-bold text-gray-900">
                {formatCurrency(rate?.effectiveRate || 0)}
                <span className="text-lg font-normal text-gray-400">/g</span>
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Base Rate/gram</p>
                <p className="text-lg font-semibold">{formatCurrency(rate?.ratePerGram || 0)}</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-3">
                <p className="text-xs text-gray-500">Rate/kg</p>
                <p className="text-lg font-semibold">{formatCurrency(rate?.ratePerKg || 0)}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-lg border border-gray-200 p-3">
              {rate?.source === 'API' ? (
                <Wifi className="h-4 w-4 text-green-500" />
              ) : (
                <WifiOff className="h-4 w-4 text-amber-500" />
              )}
              <span className="text-sm text-gray-600">
                API Connection: {rate?.source === 'API' ? 'Connected' : 'Disconnected / Manual'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <Clock className="h-3.5 w-3.5" />
              Last updated: {rate?.updatedAt ? new Date(rate.updatedAt).toLocaleString('en-IN') : 'N/A'}
            </div>
          </CardBody>
        </Card>

        {/* Controls */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Buffer Percentage</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-gray-500">
                Add a buffer on top of the base silver rate to cover price fluctuations.
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Buffer %"
                    type="number"
                    step="0.1"
                    min="0"
                    max="50"
                    value={bufferPercent}
                    onChange={(e) => setBufferPercent(Number(e.target.value))}
                  />
                </div>
                <Button onClick={handleBufferUpdate} loading={submitting}>
                  Update
                </Button>
              </div>
              <input
                type="range"
                min="0"
                max="20"
                step="0.5"
                value={bufferPercent}
                onChange={(e) => setBufferPercent(Number(e.target.value))}
                className="w-full accent-[#722F37]"
              />
              <div className="flex justify-between text-xs text-gray-400">
                <span>0%</span>
                <span>5%</span>
                <span>10%</span>
                <span>15%</span>
                <span>20%</span>
              </div>
            </CardBody>
          </Card>

          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Manual Override</h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <p className="text-sm text-gray-500">
                Manually set the silver rate per gram. This overrides the API rate.
              </p>
              <div className="flex items-end gap-3">
                <div className="flex-1">
                  <Input
                    label="Rate per gram (INR)"
                    type="number"
                    step="0.01"
                    value={manualRate}
                    onChange={(e) => setManualRate(e.target.value)}
                    placeholder="e.g. 85.50"
                  />
                </div>
                <Button onClick={handleManualOverride} loading={submitting}>
                  Override
                </Button>
              </div>
            </CardBody>
          </Card>
        </div>
      </div>

      {/* Rate History Chart */}
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold text-gray-900">Rate History</h3>
        </CardHeader>
        <CardBody>
          {chartData.length === 0 ? (
            <p className="py-12 text-center text-gray-400">No history data available</p>
          ) : (
            <div className="h-[350px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="time"
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 12, fill: '#6b7280' }}
                    tickLine={false}
                    domain={['auto', 'auto']}
                  />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '8px',
                      border: '1px solid #e5e7eb',
                      fontSize: '13px',
                    }}
                    formatter={(v: number) => [formatCurrency(v), 'Rate/g']}
                  />
                  <Line
                    type="monotone"
                    dataKey="rate"
                    stroke="#722F37"
                    strokeWidth={2}
                    dot={{ fill: '#722F37', r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
