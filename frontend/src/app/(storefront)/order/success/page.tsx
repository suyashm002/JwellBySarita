'use client';

import React, { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle, Package, ArrowRight, ShoppingBag } from 'lucide-react';
import { orderAPI } from '@/lib/api';
import { Order } from '@/types/order';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { useCartStore } from '@/stores/cartStore';
import { Suspense } from 'react';

function OrderSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get('orderId');
  const orderNumberParam = searchParams.get('orderNumber');

  const [order, setOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { clearCart } = useCartStore();

  useEffect(() => {
    clearCart();

    if (orderId) {
      orderAPI
        .getById(orderId)
        .then(({ data }) => {
          setOrder(data.data);
        })
        .catch(() => {})
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, [orderId, clearCart]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#B76E79] border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 py-16">
      <div className="max-w-lg w-full text-center space-y-8">
        {/* Success animation */}
        <div className="relative mx-auto w-24 h-24">
          {/* Outer ring animation */}
          <div className="absolute inset-0 rounded-full border-4 border-emerald-200 animate-ping opacity-30" />
          {/* Inner circle */}
          <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 shadow-lg shadow-emerald-200">
            <CheckCircle className="h-12 w-12 text-white" strokeWidth={2.5} />
          </div>
        </div>

        {/* Thank you message */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900">Thank you for your order!</h1>
          <p className="text-gray-500">
            Your order has been placed successfully. We&apos;ll send you a confirmation shortly.
          </p>
        </div>

        {/* Order number */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-center gap-2 text-[#722F37]">
            <Package className="h-5 w-5" />
            <span className="text-sm font-semibold uppercase tracking-wide">Order Number</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 tracking-wide">
            {order?.orderNumber || orderNumberParam || 'N/A'}
          </p>

          {/* Order summary */}
          {order && (
            <div className="border-t border-gray-200 pt-4 mt-4 space-y-2 text-sm">
              <div className="flex justify-between text-gray-600">
                <span>Items</span>
                <span>{order.items?.length || 0}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment</span>
                <span className="capitalize">
                  {order.paymentMethod === 'COD' ? 'Cash on Delivery' : 'Online Payment'}
                </span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Payment Status</span>
                <span
                  className={
                    order.paymentStatus === 'PAID'
                      ? 'text-emerald-600 font-medium'
                      : 'text-amber-600 font-medium'
                  }
                >
                  {order.paymentStatus === 'PAID' ? 'Paid' : 'Pending'}
                </span>
              </div>
              <div className="border-t border-gray-200 pt-2 flex justify-between font-semibold text-gray-900">
                <span>Total</span>
                <span className="text-[#722F37]">{formatCurrency(order.grandTotal)}</span>
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {orderId && (
            <Link href={`/order/${orderId}`}>
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                <Package className="h-4 w-4" />
                Track Order
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
          <Link href="/shop">
            <Button variant="secondary" size="lg" className="w-full sm:w-auto">
              <ShoppingBag className="h-4 w-4" />
              Continue Shopping
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-screen"><div className="animate-spin h-8 w-8 border-4 border-[#722F37] border-t-transparent rounded-full" /></div>}>
      <OrderSuccessContent />
    </Suspense>
  );
}
