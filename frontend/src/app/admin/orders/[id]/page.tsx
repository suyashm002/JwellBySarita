'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  Package,
  Truck,
  MapPin,
  CreditCard,
  Clock,
  User,
  Copy,
  ExternalLink,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { adminAPI, orderAPI } from '@/lib/api';
import { Order, OrderStatus } from '@/types/order';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

const statusOptions: { value: OrderStatus; label: string }[] = [
  { value: 'PENDING', label: 'Pending' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PACKED', label: 'Packed' },
  { value: 'QUALITY_CHECKED', label: 'Quality Checked' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
  { value: 'RETURNED', label: 'Returned' },
];

const statusBadgeVariant: Record<OrderStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PACKED: 'info',
  QUALITY_CHECKED: 'info',
  DISPATCHED: 'default',
  OUT_FOR_DELIVERY: 'default',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [newStatus, setNewStatus] = useState<OrderStatus | ''>('');
  const [statusNote, setStatusNote] = useState('');
  const [updating, setUpdating] = useState(false);
  const [trackingNumber, setTrackingNumber] = useState('');
  const [courierName, setCourierName] = useState('');

  const loadOrder = async () => {
    try {
      const res = await orderAPI.getById(orderId);
      const found = res.data.data;
      setOrder(found);
      setTrackingNumber(found.trackingNumber || '');
      setCourierName(found.courierName || '');
    } catch (err) {
      console.error('Failed to load order:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const handleStatusUpdate = async () => {
    if (!newStatus || !order) return;
    try {
      setUpdating(true);
      await adminAPI.updateOrderStatus(order.id, {
        status: newStatus,
        note: statusNote,
        trackingNumber: trackingNumber || undefined,
        courierName: courierName || undefined,
      });
      toast.success('Order status updated');
      setNewStatus('');
      setStatusNote('');
      await loadOrder();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <div className="grid gap-6 lg:grid-cols-3">
          <Skeleton className="h-64 rounded-xl lg:col-span-2" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-500">Order not found</p>
        <Button variant="secondary" className="mt-4" onClick={() => router.push('/admin/orders')}>
          Back to Orders
        </Button>
      </div>
    );
  }

  const address = order.addressSnapshot;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => router.push('/admin/orders')}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold text-gray-900">Order {order.orderNumber}</h1>
            <Badge variant={statusBadgeVariant[order.status]}>
              {order.status.replace(/_/g, ' ')}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">
            Placed on{' '}
            {new Date(order.createdAt).toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column */}
        <div className="space-y-6 lg:col-span-2">
          {/* Status Update */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="h-5 w-5 text-gray-400" />
                Update Status
              </h3>
            </CardHeader>
            <CardBody className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <Select
                  label="New Status"
                  options={statusOptions}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value as OrderStatus)}
                  placeholder="Select status"
                />
                <Input
                  label="Note (optional)"
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Add a note..."
                />
              </div>
              {(newStatus === 'DISPATCHED' || newStatus === 'OUT_FOR_DELIVERY') && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Tracking Number"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                  />
                  <Input
                    label="Courier Name"
                    value={courierName}
                    onChange={(e) => setCourierName(e.target.value)}
                    placeholder="e.g. Delhivery, BlueDart"
                  />
                </div>
              )}
              <Button onClick={handleStatusUpdate} loading={updating} disabled={!newStatus}>
                Update Status
              </Button>
            </CardBody>
          </Card>

          {/* Order Items */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Package className="h-5 w-5 text-gray-400" />
                Order Items
              </h3>
            </CardHeader>
            <CardBody>
              <div className="divide-y divide-gray-100">
                {order.items?.map((item) => {
                  const snapshot = item.productSnapshot || {};
                  return (
                    <div key={item.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
                      <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-gray-200 bg-gray-50">
                        {snapshot.image ? (
                          <img src={snapshot.image} alt={snapshot.name || ''} className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-xs text-gray-300">N/A</div>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">{snapshot.name || `Product #${item.productId}`}</p>
                        <p className="text-sm text-gray-500">
                          Qty: {item.quantity} &middot; Silver: {item.silverWeight}g @ {formatCurrency(item.silverRateUsed)}/g
                        </p>
                        <div className="mt-1 flex flex-wrap gap-x-4 text-xs text-gray-400">
                          <span>Silver: {formatCurrency(item.silverCost)}</span>
                          <span>Gemstone: {formatCurrency(item.gemstoneCost)}</span>
                          <span>Making: {formatCurrency(item.makingCharge)}</span>
                        </div>
                      </div>
                      <p className="shrink-0 font-semibold text-gray-900">{formatCurrency(item.totalPrice)}</p>
                    </div>
                  );
                })}
              </div>

              {/* Price Summary */}
              <div className="mt-4 space-y-2 border-t border-gray-100 pt-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Subtotal</span>
                  <span>{formatCurrency(order.subtotal)}</span>
                </div>
                {order.discountAmount > 0 && (
                  <div className="flex justify-between text-sm text-green-600">
                    <span>Discount {order.couponCode && `(${order.couponCode})`}</span>
                    <span>-{formatCurrency(order.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Shipping</span>
                  <span>{order.shippingCost === 0 ? 'Free' : formatCurrency(order.shippingCost)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">GST (CGST: {formatCurrency(order.cgst)} + SGST: {formatCurrency(order.sgst)})</span>
                  <span>{formatCurrency(order.totalGst)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-100 pt-2 text-base font-bold">
                  <span>Grand Total</span>
                  <span className="text-[#722F37]">{formatCurrency(order.grandTotal)}</span>
                </div>
              </div>
            </CardBody>
          </Card>

          {/* Status History Timeline */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Clock className="h-5 w-5 text-gray-400" />
                Status History
              </h3>
            </CardHeader>
            <CardBody>
              {!order.statusHistory || order.statusHistory.length === 0 ? (
                <p className="text-sm text-gray-400">No status updates yet</p>
              ) : (
                <div className="relative">
                  {order.statusHistory.map((h, i) => (
                    <div key={h.id} className="relative flex gap-4 pb-6 last:pb-0">
                      {i < order.statusHistory!.length - 1 && (
                        <div className="absolute left-[11px] top-6 h-full w-0.5 bg-gray-200" />
                      )}
                      <div className="relative z-10 mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#722F37]">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{h.status.replace(/_/g, ' ')}</p>
                        {h.note && <p className="mt-0.5 text-sm text-gray-500">{h.note}</p>}
                        <p className="mt-0.5 text-xs text-gray-400">
                          {new Date(h.createdAt).toLocaleString('en-IN')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Right column */}
        <div className="space-y-6">
          {/* Customer */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <User className="h-5 w-5 text-gray-400" />
                Customer
              </h3>
            </CardHeader>
            <CardBody className="space-y-2">
              <p className="font-medium text-gray-900">{address?.name || 'N/A'}</p>
              {address?.phone && <p className="text-sm text-gray-500">{address.phone}</p>}
              {address?.email && <p className="text-sm text-gray-500">{address.email}</p>}
            </CardBody>
          </Card>

          {/* Shipping Address */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <MapPin className="h-5 w-5 text-gray-400" />
                Shipping Address
              </h3>
            </CardHeader>
            <CardBody>
              {address ? (
                <div className="space-y-1 text-sm text-gray-600">
                  <p className="font-medium text-gray-900">{address.name}</p>
                  <p>{address.line1}</p>
                  {address.line2 && <p>{address.line2}</p>}
                  <p>{address.city}, {address.state} - {address.pincode}</p>
                  {address.phone && <p>Phone: {address.phone}</p>}
                </div>
              ) : (
                <p className="text-sm text-gray-400">No address on file</p>
              )}
            </CardBody>
          </Card>

          {/* Payment */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <CreditCard className="h-5 w-5 text-gray-400" />
                Payment
              </h3>
            </CardHeader>
            <CardBody className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Method</span>
                <span className="font-medium">{order.paymentMethod || 'N/A'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <Badge variant={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'FAILED' ? 'danger' : 'warning'}>
                  {order.paymentStatus}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Silver Rate at Order</span>
                <span>{formatCurrency(order.silverRateAtOrder)}/g</span>
              </div>
            </CardBody>
          </Card>

          {/* Fulfilment */}
          <Card>
            <CardHeader>
              <h3 className="flex items-center gap-2 text-lg font-semibold text-gray-900">
                <Truck className="h-5 w-5 text-gray-400" />
                Fulfilment
              </h3>
            </CardHeader>
            <CardBody className="space-y-2">
              {order.trackingNumber ? (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Courier</span>
                    <span className="font-medium">{order.courierName || '-'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">Tracking #</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-xs">{order.trackingNumber}</span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(order.trackingNumber || '');
                          toast.success('Copied');
                        }}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                  {order.trackingUrl && (
                    <a
                      href={order.trackingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-sm text-[#722F37] hover:underline"
                    >
                      Track Shipment <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {order.estimatedDelivery && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Est. Delivery</span>
                      <span>{new Date(order.estimatedDelivery).toLocaleDateString('en-IN')}</span>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-sm text-gray-400">Not dispatched yet</p>
              )}
              {order.giftWrap && (
                <div className="mt-2 rounded-lg bg-amber-50 p-3">
                  <p className="text-xs font-semibold text-amber-700">Gift Wrap Requested</p>
                  {order.giftMessage && (
                    <p className="mt-1 text-xs text-amber-600">&ldquo;{order.giftMessage}&rdquo;</p>
                  )}
                </div>
              )}
            </CardBody>
          </Card>

          {order.notes && (
            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold text-gray-900">Notes</h3>
              </CardHeader>
              <CardBody>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </CardBody>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
