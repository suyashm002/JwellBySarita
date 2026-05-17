'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  ShoppingBag,
  ArrowLeft,
  Minus,
  Plus,
  Trash2,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useSilverRateStore } from '@/stores/silverRateStore';
import { CartSummaryPanel } from '@/components/cart/CartSummary';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PRICE_LOCK_MINUTES } from '@/lib/constants';

export default function CartPage() {
  const {
    items,
    itemCount,
    isLoading,
    summary,
    fetchCart,
    fetchSummary,
    updateQuantity,
    removeItem,
    applyCoupon,
    removeCoupon,
  } = useCartStore();
  const { rate, fetchRate } = useSilverRateStore();

  useEffect(() => {
    fetchCart();
    fetchSummary();
    fetchRate();
  }, [fetchCart, fetchSummary, fetchRate]);

  // Price lock countdown
  const [lockRemaining, setLockRemaining] = React.useState<string | null>(null);

  const priceLockExpiresAt = items[0]?.lockedAt
    ? new Date(new Date(items[0].lockedAt).getTime() + PRICE_LOCK_MINUTES * 60 * 1000)
    : null;

  useEffect(() => {
    const updateCountdown = () => {
      if (!priceLockExpiresAt) {
        setLockRemaining(null);
        return;
      }
      const diff = priceLockExpiresAt.getTime() - Date.now();
      if (diff <= 0) {
        setLockRemaining(null);
        return;
      }
      const mins = Math.floor(diff / 60000);
      const secs = Math.floor((diff % 60000) / 1000);
      setLockRemaining(`${mins}:${secs.toString().padStart(2, '0')}`);
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [priceLockExpiresAt]);

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#B76E79] border-t-transparent" />
      </div>
    );
  }

  // Empty cart state
  if (items.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 py-16">
        <ShoppingBag className="h-24 w-24 text-gray-200 mb-6" />
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-8 max-w-md">
          Looks like you haven&apos;t added any jewellery yet. Browse our collection to find
          something you love.
        </p>
        <Link href="/shop">
          <Button variant="primary" size="lg">
            <ArrowLeft className="h-4 w-4" />
            Continue Shopping
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
          Shopping Cart
          <span className="text-base font-normal text-gray-500 ml-2">
            ({itemCount} {itemCount === 1 ? 'item' : 'items'})
          </span>
        </h1>
        <Link
          href="/shop"
          className="text-sm text-[#722F37] hover:text-[#5e262d] font-medium flex items-center gap-1 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Continue Shopping
        </Link>
      </div>

      {/* Silver rate banner */}
      {rate && (
        <div className="mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-gradient-to-r from-[#D4AF37]/10 to-[#B76E79]/10 border border-[#D4AF37]/30 rounded-xl px-5 py-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-[#D4AF37]" />
            <span className="text-sm font-medium text-[#722F37]">
              Live Silver Rate: {formatCurrency(rate.effectiveRate)}/g
            </span>
          </div>
          {lockRemaining && (
            <div className="flex items-center gap-2 bg-white/60 rounded-lg px-3 py-1.5">
              <Timer className="h-4 w-4 text-[#B76E79]" />
              <span className="text-sm font-semibold text-[#722F37]">
                Price locked for {lockRemaining}
              </span>
            </div>
          )}
        </div>
      )}

      {/* 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items - left */}
        <div className="lg:col-span-2 space-y-0">
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            {/* Table header */}
            <div className="hidden sm:grid grid-cols-12 gap-4 px-5 py-3 bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              <div className="col-span-6">Product</div>
              <div className="col-span-2 text-center">Quantity</div>
              <div className="col-span-2 text-right">Price</div>
              <div className="col-span-2 text-right">Total</div>
            </div>

            {/* Items */}
            {items.map((item) => {
              const primaryImage =
                item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
              const imageUrl = primaryImage?.url || '/images/placeholder-product.png';
              const unitPrice = item.pricing?.total ?? item.product.pricing?.total ?? 0;
              const lineTotal = unitPrice * item.quantity;

              return (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center px-5 py-5 border-b border-gray-100 last:border-b-0 hover:bg-gray-50/50 transition-colors"
                >
                  {/* Product info */}
                  <div className="sm:col-span-6 flex items-center gap-4">
                    <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
                      <Image
                        src={imageUrl}
                        alt={item.product.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                    <div className="min-w-0">
                      <Link
                        href={`/product/${item.product.slug}`}
                        className="text-sm font-medium text-gray-900 hover:text-[#722F37] transition-colors line-clamp-2"
                      >
                        {item.product.name}
                      </Link>
                      {item.variant && (
                        <p className="text-xs text-gray-500 mt-1">
                          {item.variant.type}: {item.variant.value}
                        </p>
                      )}
                      {item.product.silverPurity && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          {item.product.silverPurity === 'STERLING_925'
                            ? '925 Sterling Silver'
                            : '999 Fine Silver'}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity */}
                  <div className="sm:col-span-2 flex items-center sm:justify-center">
                    <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
                      <button
                        onClick={() => updateQuantity(item.id, Math.max(1, item.quantity - 1))}
                        disabled={item.quantity <= 1}
                        className="flex items-center justify-center h-8 w-8 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="flex items-center justify-center h-8 w-10 text-sm font-medium text-gray-900 border-x border-gray-200">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        disabled={item.quantity >= item.product.stock}
                        className="flex items-center justify-center h-8 w-8 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                        aria-label="Increase quantity"
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Unit price */}
                  <div className="sm:col-span-2 text-right">
                    <span className="text-sm text-gray-600 sm:hidden mr-2">Price:</span>
                    <span className="text-sm text-gray-700">
                      {formatCurrency(unitPrice)}
                    </span>
                  </div>

                  {/* Line total + remove */}
                  <div className="sm:col-span-2 flex items-center justify-end gap-3">
                    <span className="text-sm font-semibold text-[#722F37]">
                      {formatCurrency(lineTotal)}
                    </span>
                    <button
                      onClick={() => removeItem(item.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Order summary - right */}
        <div className="lg:col-span-1 space-y-4">
          {summary && (
            <CartSummaryPanel
              summary={summary}
              onApplyCoupon={applyCoupon}
              onRemoveCoupon={removeCoupon}
            />
          )}

          <Link href="/checkout" className="block">
            <Button variant="primary" size="lg" className="w-full text-base">
              Proceed to Checkout
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
