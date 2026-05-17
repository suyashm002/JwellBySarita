'use client';

import React, { useEffect, useState } from 'react';
import {
  ShoppingCart,
  IndianRupee,
  TrendingUp,
  ShoppingBag,
  RotateCcw,
  AlertTriangle,
  Crown,
} from 'lucide-react';
import { StatsCard } from '@/components/admin/StatsCard';
import { RevenueChart, RevenueDataPoint } from '@/components/admin/RevenueChart';
import { OrdersTable } from '@/components/admin/OrdersTable';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { Order } from '@/types/order';

interface DashboardData {
  totalOrders: number;
  totalRevenue: number;
  totalGst: number;
  aov: number;
  abandonedCartRate: number;
  recoveryRate: number;
  revenueChart: RevenueDataPoint[];
  silverRateToday: number;
  silverRateYesterday: number;
  recentOrders: Order[];
  lowStockProducts: { id: string; name: string; stock: number; lowStockThreshold: number }[];
  topProducts: { id: string; name: string; totalSold: number; revenue: number }[];
  ordersChange: number;
  revenueChange: number;
}

export default function AdminDashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await adminAPI.getDashboard();
        setData(res.data.data);
      } catch (err) {
        console.error('Failed to load dashboard:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-32 w-full rounded-xl" />
          ))}
        </div>
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  const silverRateChange = data
    ? ((data.silverRateToday - data.silverRateYesterday) / data.silverRateYesterday) * 100
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard
          title="Total Orders"
          value={data?.totalOrders?.toLocaleString('en-IN') || '0'}
          change={data?.ordersChange}
          icon={ShoppingCart}
          color="blue"
        />
        <StatsCard
          title="Revenue"
          value={formatCurrency(data?.totalRevenue || 0)}
          change={data?.revenueChange}
          icon={IndianRupee}
          color="green"
        />
        <StatsCard
          title="Avg. Order Value"
          value={formatCurrency(data?.aov || 0)}
          icon={TrendingUp}
          color="burgundy"
        />
        <StatsCard
          title="Abandoned Cart Rate"
          value={`${parseFloat(String(data?.abandonedCartRate ?? '0'))}%`}
          icon={ShoppingBag}
          color="amber"
        />
        <StatsCard
          title="Recovery Rate"
          value={`${(data?.recoveryRate || 0).toFixed(1)}%`}
          icon={RotateCcw}
          color="green"
        />
      </div>

      {/* Revenue Chart + Silver Rate */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={data?.revenueChart || []} />
        </div>
        <Card>
          <CardHeader>
            <h3 className="text-lg font-semibold text-gray-900">Silver Rate</h3>
          </CardHeader>
          <CardBody className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Today&apos;s Rate</p>
              <p className="text-3xl font-bold text-gray-900">
                {formatCurrency(data?.silverRateToday || 0)}
                <span className="text-sm font-normal text-gray-400">/g</span>
              </p>
            </div>
            <div className="flex items-center gap-2">
              <p className="text-sm text-gray-500">vs Yesterday:</p>
              <Badge variant={silverRateChange >= 0 ? 'success' : 'danger'}>
                {silverRateChange >= 0 ? '+' : ''}
                {silverRateChange.toFixed(2)}%
              </Badge>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">Yesterday&apos;s Rate</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatCurrency(data?.silverRateYesterday || 0)}/g
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3">
              <p className="text-sm text-gray-500">GST Collected</p>
              <p className="text-lg font-semibold text-gray-700">
                {formatCurrency(data?.totalGst || 0)}
              </p>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Recent Orders + Low Stock + Top Products */}
      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2">
          <Card>
            <CardHeader>
              <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
            </CardHeader>
            <CardBody className="p-0">
              <OrdersTable orders={data?.recentOrders || []} />
            </CardBody>
          </Card>
        </div>
        <div className="space-y-6">
          {/* Low Stock Alerts */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-500" />
                <h3 className="text-lg font-semibold text-gray-900">Low Stock Alerts</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {(!data?.lowStockProducts || data.lowStockProducts.length === 0) ? (
                <p className="text-sm text-gray-400">All products are well stocked</p>
              ) : (
                data.lowStockProducts.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/50 px-3 py-2"
                  >
                    <p className="text-sm font-medium text-gray-900 truncate max-w-[160px]">
                      {p.name}
                    </p>
                    <Badge variant="warning">{p.stock} left</Badge>
                  </div>
                ))
              )}
            </CardBody>
          </Card>

          {/* Top Products */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-[#722F37]" />
                <h3 className="text-lg font-semibold text-gray-900">Top 5 Products</h3>
              </div>
            </CardHeader>
            <CardBody className="space-y-3">
              {(!data?.topProducts || data.topProducts.length === 0) ? (
                <p className="text-sm text-gray-400">No sales data yet</p>
              ) : (
                data.topProducts.map((p, i) => (
                  <div key={p.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#722F37]/10 text-xs font-bold text-[#722F37]">
                      {i + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500">
                        {p.totalSold} sold &middot; {formatCurrency(p.revenue)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </CardBody>
          </Card>
        </div>
      </div>
    </div>
  );
}
