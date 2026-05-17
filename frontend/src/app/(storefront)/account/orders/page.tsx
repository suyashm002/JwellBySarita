'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Package,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ChevronRight,
  Filter,
  ShoppingBag,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useRequireAuth } from '@/hooks/useAuth';
import { orderAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { ORDER_STATUSES } from '@/lib/constants';
import type { Order, OrderStatus } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function statusVariant(status: OrderStatus) {
  const map: Record<string, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
    PENDING: 'warning',
    CONFIRMED: 'info',
    PACKED: 'info',
    QUALITY_CHECKED: 'info',
    DISPATCHED: 'info',
    OUT_FOR_DELIVERY: 'warning',
    DELIVERED: 'success',
    CANCELLED: 'danger',
    RETURNED: 'danger',
  };
  return map[status] ?? 'default';
}

function statusLabel(status: OrderStatus) {
  return ORDER_STATUSES.find((s) => s.value === status)?.label ?? status;
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

const ITEMS_PER_PAGE = 10;

export default function OrdersPage() {
  useRequireAuth();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const params: Record<string, any> = {
        page,
        limit: ITEMS_PER_PAGE,
      };
      if (statusFilter !== 'ALL') params.status = statusFilter;

      const { data: res } = await orderAPI.getAll(params);
      setOrders(res.data?.orders ?? res.data ?? []);
      const total = res.data?.totalPages ?? res.data?.pagination?.totalPages ?? 1;
      setTotalPages(total);
    } catch (err: any) {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const toggleExpand = (id: string) =>
    setExpandedId((prev) => (prev === id ? null : id));

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/account"
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#722F37]"
          >
            <ChevronLeft className="h-3 w-3" />
            My Account
          </Link>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">
            My Orders
          </h1>
        </div>
      </div>

      {/* Filter bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <Filter className="h-4 w-4 shrink-0 text-gray-400" />
        {['ALL', ...ORDER_STATUSES.map((s) => s.value)].map((val) => {
          const label = val === 'ALL' ? 'All' : statusLabel(val as OrderStatus);
          const active = statusFilter === val;
          return (
            <button
              key={val}
              onClick={() => {
                setStatusFilter(val);
                setPage(1);
              }}
              className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                active
                  ? 'bg-[#722F37] text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>

      {/* Loading */}
      {loading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-24" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && orders.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <ShoppingBag className="h-8 w-8 text-gray-400" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">No orders yet</h2>
            <p className="text-sm text-gray-500">
              When you place orders, they will appear here.
            </p>
            <Link href="/shop">
              <Button>Browse Jewellery</Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Order list */}
      {!loading &&
        orders.map((order) => {
          const expanded = expandedId === order.id;
          return (
            <Card key={order.id} className="overflow-hidden">
              {/* Summary row */}
              <button
                type="button"
                onClick={() => toggleExpand(order.id)}
                className="flex w-full items-center gap-4 px-6 py-4 text-left transition-colors hover:bg-gray-50"
              >
                <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#B76E79]/10">
                  <Package className="h-5 w-5 text-[#722F37]" />
                </span>

                <div className="flex-1 space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-gray-900">
                      #{order.orderNumber}
                    </span>
                    <Badge variant={statusVariant(order.status)}>
                      {statusLabel(order.status)}
                    </Badge>
                  </div>
                  <p className="text-xs text-gray-500">
                    {formatDate(order.createdAt)} &middot; {order.items.length}{' '}
                    {order.items.length === 1 ? 'item' : 'items'}
                  </p>
                </div>

                <span className="text-sm font-bold text-gray-900">
                  {formatCurrency(order.grandTotal)}
                </span>

                {expanded ? (
                  <ChevronUp className="h-4 w-4 text-gray-400" />
                ) : (
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                )}
              </button>

              {/* Expanded detail */}
              {expanded && (
                <div className="border-t border-gray-100 bg-gray-50/50 px-6 py-4">
                  <div className="space-y-3">
                    {order.items.map((item) => {
                      const snapshot = item.productSnapshot;
                      const name =
                        typeof snapshot === 'object' && snapshot?.name
                          ? snapshot.name
                          : `Product #${item.productId.slice(0, 8)}`;
                      const image =
                        typeof snapshot === 'object' &&
                        snapshot?.images?.[0]?.url;
                      return (
                        <div key={item.id} className="flex items-center gap-3">
                          {image ? (
                            <img
                              src={image}
                              alt={name}
                              className="h-12 w-12 rounded-lg border border-gray-200 object-cover"
                            />
                          ) : (
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-gray-200 bg-gray-100">
                              <Package className="h-5 w-5 text-gray-300" />
                            </div>
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">
                              {name}
                            </p>
                            <p className="text-xs text-gray-500">
                              Qty: {item.quantity} &middot;{' '}
                              {formatCurrency(item.totalPrice)}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Pricing summary */}
                  <div className="mt-4 flex items-center justify-between border-t border-gray-200 pt-3">
                    <div className="space-y-0.5 text-xs text-gray-500">
                      <p>Subtotal: {formatCurrency(order.subtotal)}</p>
                      <p>GST: {formatCurrency(order.totalGst)}</p>
                      <p>Shipping: {formatCurrency(order.shippingCost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Grand Total</p>
                      <p className="text-lg font-bold text-[#722F37]">
                        {formatCurrency(order.grandTotal)}
                      </p>
                    </div>
                  </div>

                  {order.trackingNumber && (
                    <div className="mt-3 rounded-lg bg-blue-50 px-4 py-2 text-xs text-blue-700">
                      Tracking: {order.courierName ?? 'Courier'} &mdash;{' '}
                      {order.trackingUrl ? (
                        <a
                          href={order.trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-semibold underline"
                        >
                          {order.trackingNumber}
                        </a>
                      ) : (
                        <span className="font-semibold">{order.trackingNumber}</span>
                      )}
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}

      {/* Pagination */}
      {!loading && totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 pt-4">
          <Button
            variant="secondary"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <span className="text-sm text-gray-500">
            Page {page} of {totalPages}
          </span>
          <Button
            variant="secondary"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
