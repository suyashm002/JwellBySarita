'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import {
  Package,
  CheckCircle,
  Truck,
  MapPin,
  ExternalLink,
  ArrowLeft,
  XCircle,
  RotateCcw,
  Clock,
  ShieldCheck,
  Box,
  PackageCheck,
  Navigation,
} from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { Order, OrderStatus } from '@/types/order';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { ORDER_STATUSES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import toast from 'react-hot-toast';

const STATUS_STEPS: { status: OrderStatus; label: string; icon: React.ElementType }[] = [
  { status: 'CONFIRMED', label: 'Confirmed', icon: CheckCircle },
  { status: 'PACKED', label: 'Packed', icon: Box },
  { status: 'QUALITY_CHECKED', label: 'Quality Checked', icon: ShieldCheck },
  { status: 'DISPATCHED', label: 'Dispatched', icon: Truck },
  { status: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', icon: Navigation },
  { status: 'DELIVERED', label: 'Delivered', icon: PackageCheck },
];

function getStatusIndex(status: OrderStatus): number {
  const idx = STATUS_STEPS.findIndex((s) => s.status === status);
  return idx >= 0 ? idx : -1;
}

function getStatusBadgeVariant(status: OrderStatus) {
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
  return map[status] || 'default';
}

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);

  useEffect(() => {
    if (!orderId) return;
    orderAPI
      .getById(orderId)
      .then(({ data }) => setOrder(data.data))
      .catch(() => toast.error('Failed to load order'))
      .finally(() => setIsLoading(false));
  }, [orderId]);

  const handleCancel = async () => {
    if (!order) return;
    const confirmed = window.confirm(
      'Are you sure you want to cancel this order? This action cannot be undone.'
    );
    if (!confirmed) return;

    setIsCancelling(true);
    try {
      await orderAPI.cancel(order.id);
      const { data } = await orderAPI.getById(order.id);
      setOrder(data.data);
      toast.success('Order cancelled');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleReturn = async () => {
    if (!order) return;
    const reason = window.prompt('Please provide a reason for return:');
    if (!reason) return;

    try {
      await orderAPI.requestReturn(order.id, { reason });
      const { data } = await orderAPI.getById(order.id);
      setOrder(data.data);
      toast.success('Return request submitted');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit return request');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#B76E79] border-t-transparent" />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <Package className="h-16 w-16 text-gray-200 mb-4" />
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Order not found</h2>
        <p className="text-gray-500 mb-6">
          The order you are looking for does not exist or you do not have access.
        </p>
        <Button onClick={() => router.push('/shop')} variant="primary">
          Go to Shop
        </Button>
      </div>
    );
  }

  const currentStatusIdx = getStatusIndex(order.status);
  const isCancelled = order.status === 'CANCELLED';
  const isReturned = order.status === 'RETURNED';
  const canCancel = ['PENDING', 'CONFIRMED'].includes(order.status);
  const canReturn = order.status === 'DELIVERED';
  const address = order.addressSnapshot;

  const statusLabel =
    ORDER_STATUSES.find((s) => s.value === order.status)?.label || order.status;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back link */}
      <Link
        href="/account/orders"
        className="inline-flex items-center gap-1 text-sm text-[#722F37] hover:text-[#5e262d] font-medium mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Orders
      </Link>

      {/* Order header */}
      <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-gray-900">
                Order #{order.orderNumber}
              </h1>
              <Badge variant={getStatusBadgeVariant(order.status)}>{statusLabel}</Badge>
            </div>
            <p className="text-sm text-gray-500">
              Placed on{' '}
              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {canCancel && (
              <Button
                onClick={handleCancel}
                loading={isCancelling}
                variant="ghost"
                size="sm"
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <XCircle className="h-4 w-4" />
                Cancel Order
              </Button>
            )}
            {canReturn && (
              <Button
                onClick={handleReturn}
                variant="ghost"
                size="sm"
                className="text-amber-600 hover:text-amber-700 hover:bg-amber-50"
              >
                <RotateCcw className="h-4 w-4" />
                Return
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Status timeline */}
      {!isCancelled && !isReturned && (
        <div className="bg-white border border-gray-200 rounded-xl p-5 mb-6">
          <h2 className="text-base font-semibold text-gray-900 mb-6">Order Status</h2>
          <div className="relative">
            {/* Progress line */}
            <div className="absolute left-6 top-6 bottom-6 w-0.5 bg-gray-200" />
            {currentStatusIdx >= 0 && (
              <div
                className="absolute left-6 top-6 w-0.5 bg-emerald-500 transition-all duration-500"
                style={{
                  height: `${(currentStatusIdx / (STATUS_STEPS.length - 1)) * 100}%`,
                  maxHeight: 'calc(100% - 48px)',
                }}
              />
            )}

            <div className="space-y-6 relative">
              {STATUS_STEPS.map(({ status, label, icon: Icon }, index) => {
                const isCompleted = currentStatusIdx >= index;
                const isCurrent = currentStatusIdx === index;
                const historyEntry = order.statusHistory?.find((h) => h.status === status);

                return (
                  <div key={status} className="flex items-start gap-4">
                    <div
                      className={cn(
                        'relative z-10 flex items-center justify-center h-12 w-12 rounded-full border-2 transition-all',
                        isCompleted
                          ? 'bg-emerald-500 border-emerald-500 text-white'
                          : 'bg-white border-gray-300 text-gray-400'
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      {isCurrent && (
                        <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-400 ring-2 ring-white animate-pulse" />
                      )}
                    </div>
                    <div className="pt-2.5">
                      <p
                        className={cn(
                          'text-sm font-medium',
                          isCompleted ? 'text-gray-900' : 'text-gray-400'
                        )}
                      >
                        {label}
                      </p>
                      {historyEntry && (
                        <p className="text-xs text-gray-500 mt-0.5">
                          {new Date(historyEntry.createdAt).toLocaleDateString('en-IN', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                          {historyEntry.note && ` - ${historyEntry.note}`}
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Estimated delivery */}
          {order.estimatedDelivery && currentStatusIdx < STATUS_STEPS.length - 1 && (
            <div className="mt-6 flex items-center gap-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg p-3">
              <Clock className="h-4 w-4 text-[#D4AF37]" />
              <span className="text-sm text-[#722F37] font-medium">
                Estimated Delivery:{' '}
                {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                })}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Cancelled / returned notice */}
      {(isCancelled || isReturned) && (
        <div
          className={cn(
            'border rounded-xl p-5 mb-6',
            isCancelled
              ? 'bg-red-50 border-red-200'
              : 'bg-amber-50 border-amber-200'
          )}
        >
          <div className="flex items-center gap-3">
            {isCancelled ? (
              <XCircle className="h-6 w-6 text-red-500" />
            ) : (
              <RotateCcw className="h-6 w-6 text-amber-500" />
            )}
            <div>
              <p
                className={cn(
                  'text-sm font-semibold',
                  isCancelled ? 'text-red-700' : 'text-amber-700'
                )}
              >
                Order {isCancelled ? 'Cancelled' : 'Returned'}
              </p>
              <p
                className={cn(
                  'text-xs',
                  isCancelled ? 'text-red-500' : 'text-amber-500'
                )}
              >
                {order.statusHistory?.find(
                  (h) => h.status === (isCancelled ? 'CANCELLED' : 'RETURNED')
                )?.note || 'No additional details'}
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order items */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                Order Items ({order.items.length})
              </h2>
            </div>
            <div className="divide-y divide-gray-100">
              {order.items.map((item) => {
                const snapshot = item.productSnapshot;
                const img = snapshot?.images?.find((i: any) => i.isPrimary) || snapshot?.images?.[0];

                return (
                  <div
                    key={item.id}
                    className="flex gap-4 px-5 py-4"
                  >
                    <div className="relative h-16 w-16 flex-shrink-0 rounded-lg bg-gray-50 border border-gray-200 overflow-hidden">
                      {img?.url ? (
                        <Image
                          src={img.url}
                          alt={snapshot?.name || 'Product'}
                          fill
                          className="object-cover"
                          sizes="64px"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {snapshot?.name || 'Product'}
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">Qty: {item.quantity}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        Silver: {item.silverWeight}g @ {formatCurrency(item.silverRateUsed)}/g
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-semibold text-[#722F37]">
                        {formatCurrency(item.totalPrice)}
                      </p>
                      {item.quantity > 1 && (
                        <p className="text-xs text-gray-400">
                          {formatCurrency(item.unitPrice)} each
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Price breakdown */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4">Price Breakdown</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Discount{order.couponCode ? ` (${order.couponCode})` : ''}</span>
                  <span>-{formatCurrency(order.discountAmount)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>Shipping</span>
                <span>
                  {order.shippingCost === 0 ? (
                    <span className="text-emerald-600 font-medium">FREE</span>
                  ) : (
                    formatCurrency(order.shippingCost)
                  )}
                </span>
              </div>
              {order.shippingInsurance > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>Shipping Insurance</span>
                  <span>{formatCurrency(order.shippingInsurance)}</span>
                </div>
              )}
              <div className="flex justify-between text-gray-600">
                <span>GST (3%)</span>
                <span>{formatCurrency(order.totalGst)}</span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between">
                <span className="text-base font-bold text-gray-900">Grand Total</span>
                <span className="text-lg font-bold text-[#722F37]">
                  {formatCurrency(order.grandTotal)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar: shipping address & tracking */}
        <div className="lg:col-span-1 space-y-6">
          {/* Shipping address */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-[#722F37]" />
              Shipping Address
            </h2>
            {address ? (
              <div className="text-sm text-gray-600 space-y-1">
                <p className="font-medium text-gray-900">{address.name}</p>
                <p>{address.line1}</p>
                {address.line2 && <p>{address.line2}</p>}
                <p>
                  {address.city}, {address.state} - {address.pincode}
                </p>
                <p className="text-gray-500">Phone: {address.phone}</p>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Address not available</p>
            )}
          </div>

          {/* Tracking info */}
          {(order.trackingNumber || order.courierName) && (
            <div className="bg-white border border-gray-200 rounded-xl p-5">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2 mb-3">
                <Truck className="h-4 w-4 text-[#722F37]" />
                Tracking Information
              </h2>
              <div className="space-y-2 text-sm">
                {order.courierName && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Courier</span>
                    <span className="text-gray-900 font-medium">{order.courierName}</span>
                  </div>
                )}
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Tracking #</span>
                    <span className="text-gray-900 font-mono text-xs">
                      {order.trackingNumber}
                    </span>
                  </div>
                )}
                {order.trackingUrl && (
                  <a
                    href={order.trackingUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 mt-2 text-[#722F37] hover:text-[#5e262d] font-medium text-sm transition-colors"
                  >
                    Track Package
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* Payment info */}
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-3">Payment</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Method</span>
                <span className="text-gray-900 font-medium">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Status</span>
                <Badge
                  variant={
                    order.paymentStatus === 'PAID'
                      ? 'success'
                      : order.paymentStatus === 'FAILED'
                      ? 'danger'
                      : 'warning'
                  }
                >
                  {order.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Silver Rate</span>
                <span className="text-gray-900">
                  {formatCurrency(order.silverRateAtOrder)}/g
                </span>
              </div>
            </div>
          </div>

          {/* Gift info */}
          {order.giftWrap && (
            <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-xl p-5">
              <p className="text-sm font-medium text-[#722F37] mb-1">Gift Wrapped</p>
              {order.giftMessage && (
                <p className="text-xs text-gray-600 italic">
                  &ldquo;{order.giftMessage}&rdquo;
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
