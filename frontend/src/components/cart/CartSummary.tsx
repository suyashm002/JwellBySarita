'use client';

import React, { useState } from 'react';
import { Tag, X, Loader2 } from 'lucide-react';
import { CartSummary as CartSummaryType } from '@/types/cart';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD } from '@/lib/constants';

interface CartSummaryProps {
  summary: CartSummaryType;
  onApplyCoupon?: (code: string) => Promise<void>;
  onRemoveCoupon?: () => Promise<void>;
  showCoupon?: boolean;
}

export function CartSummaryPanel({
  summary,
  onApplyCoupon,
  onRemoveCoupon,
  showCoupon = true,
}: CartSummaryProps) {
  const [couponCode, setCouponCode] = useState('');
  const [isApplying, setIsApplying] = useState(false);

  const handleApplyCoupon = async () => {
    if (!couponCode.trim() || !onApplyCoupon) return;
    setIsApplying(true);
    try {
      await onApplyCoupon(couponCode.trim().toUpperCase());
      setCouponCode('');
    } finally {
      setIsApplying(false);
    }
  };

  const isFreeShipping = summary.itemsTotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900">Order Summary</h3>

      {/* Item count */}
      <div className="text-sm text-gray-500">
        {summary.items.length} {summary.items.length === 1 ? 'item' : 'items'} in cart
      </div>

      {/* Coupon section */}
      {showCoupon && (
        <div className="space-y-2">
          {summary.couponCode ? (
            <div className="flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">
              <div className="flex items-center gap-2">
                <Tag className="h-4 w-4 text-emerald-600" />
                <span className="text-sm font-medium text-emerald-700">
                  {summary.couponCode}
                </span>
              </div>
              {onRemoveCoupon && (
                <button
                  onClick={onRemoveCoupon}
                  className="text-emerald-500 hover:text-emerald-700 transition-colors"
                  aria-label="Remove coupon"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : (
            onApplyCoupon && (
              <div className="flex gap-2">
                <Input
                  placeholder="Enter coupon code"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  onKeyDown={(e) => e.key === 'Enter' && handleApplyCoupon()}
                  className="text-sm uppercase"
                />
                <Button
                  variant="secondary"
                  size="md"
                  onClick={handleApplyCoupon}
                  disabled={!couponCode.trim() || isApplying}
                  className="flex-shrink-0"
                >
                  {isApplying ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Apply'
                  )}
                </Button>
              </div>
            )
          )}
        </div>
      )}

      {/* Price breakdown */}
      <div className="space-y-2.5 text-sm">
        <div className="flex justify-between text-gray-600">
          <span>Items Total</span>
          <span>{formatCurrency(summary.itemsTotal)}</span>
        </div>

        {summary.discount > 0 && (
          <div className="flex justify-between text-emerald-600">
            <span>Discount</span>
            <span>-{formatCurrency(summary.discount)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>Shipping</span>
          {isFreeShipping || summary.shippingCost === 0 ? (
            <span className="text-emerald-600 font-medium">FREE</span>
          ) : (
            <span>{formatCurrency(summary.shippingCost)}</span>
          )}
        </div>

        {summary.shippingInsurance > 0 && (
          <div className="flex justify-between text-gray-600">
            <span>Shipping Insurance</span>
            <span>{formatCurrency(summary.shippingInsurance)}</span>
          </div>
        )}

        <div className="flex justify-between text-gray-600">
          <span>GST (3%)</span>
          <span>{formatCurrency(summary.totalGst)}</span>
        </div>

        <div className="border-t border-gray-200 pt-2.5">
          <div className="flex justify-between items-center">
            <span className="text-base font-bold text-gray-900">Grand Total</span>
            <span className="text-xl font-bold text-[#722F37]">
              {formatCurrency(summary.grandTotal)}
            </span>
          </div>
        </div>
      </div>

      {/* Free shipping progress */}
      {!isFreeShipping && summary.shippingCost > 0 && (
        <div className="bg-[#D4AF37]/5 border border-[#D4AF37]/20 rounded-lg p-3">
          <p className="text-xs text-[#722F37]">
            Add {formatCurrency(FREE_SHIPPING_THRESHOLD - summary.itemsTotal)} more for{' '}
            <span className="font-semibold">free shipping!</span>
          </p>
          <div className="mt-1.5 h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-[#D4AF37] rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, (summary.itemsTotal / FREE_SHIPPING_THRESHOLD) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
