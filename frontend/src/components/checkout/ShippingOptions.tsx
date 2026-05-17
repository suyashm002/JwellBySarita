'use client';

import React, { useEffect, useState } from 'react';
import { Truck, Gift, Shield, AlertCircle, CheckCircle } from 'lucide-react';
import { shippingAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import { FREE_SHIPPING_THRESHOLD, INSURANCE_THRESHOLD } from '@/lib/constants';

interface ShippingOptionsProps {
  pincode: string;
  orderValue: number;
  giftWrap?: boolean;
  giftMessage?: string;
  shippingInsurance?: boolean;
  onGiftWrapChange?: (enabled: boolean) => void;
  onGiftMessageChange?: (message: string) => void;
  onShippingInsuranceChange?: (enabled: boolean) => void;
}

interface ServiceabilityInfo {
  serviceable: boolean;
  estimatedDays?: number;
  codAvailable?: boolean;
  shippingCost?: number;
}

export function ShippingOptions({
  pincode,
  orderValue,
  giftWrap = false,
  giftMessage = '',
  shippingInsurance = false,
  onGiftWrapChange,
  onGiftMessageChange,
  onShippingInsuranceChange,
}: ShippingOptionsProps) {
  const [info, setInfo] = useState<ServiceabilityInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!/^\d{6}$/.test(pincode)) return;

    const fetchServiceability = async () => {
      setIsLoading(true);
      try {
        const { data } = await shippingAPI.checkServiceability(pincode);
        setInfo(data.data);
      } catch {
        setInfo(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchServiceability();
  }, [pincode]);

  const isFreeShipping = orderValue >= FREE_SHIPPING_THRESHOLD;
  const showInsuranceRecommendation = orderValue >= INSURANCE_THRESHOLD;

  const estimatedDate = info?.estimatedDays
    ? new Date(Date.now() + info.estimatedDays * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      })
    : null;

  if (isLoading) {
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#B76E79] border-t-transparent" />
          <span className="text-sm text-gray-500">Checking shipping options...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-5">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
        <Truck className="h-5 w-5 text-[#722F37]" />
        Shipping & Extras
      </h3>

      {/* Estimated delivery */}
      {estimatedDate && (
        <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 rounded-lg p-3">
          <CheckCircle className="h-5 w-5 text-emerald-500 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-800">
              Estimated Delivery by {estimatedDate}
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">
              For pincode: {pincode}
            </p>
          </div>
        </div>
      )}

      {/* Shipping cost */}
      <div className="flex items-center justify-between py-2 border-b border-gray-100">
        <span className="text-sm text-gray-600">Shipping</span>
        {isFreeShipping ? (
          <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs font-semibold px-2.5 py-1 rounded-full border border-emerald-200">
            FREE SHIPPING
          </span>
        ) : (
          <span className="text-sm font-medium text-gray-900">
            {info?.shippingCost ? formatCurrency(info.shippingCost) : formatCurrency(99)}
          </span>
        )}
      </div>

      {/* Gift wrap toggle */}
      <div className="space-y-2">
        <label className="flex items-center justify-between cursor-pointer group">
          <div className="flex items-center gap-3">
            <Gift className="h-5 w-5 text-[#D4AF37]" />
            <div>
              <p className="text-sm font-medium text-gray-900 group-hover:text-[#722F37] transition-colors">
                Gift Wrap
              </p>
              <p className="text-xs text-gray-400">Premium gift packaging (+{formatCurrency(99)})</p>
            </div>
          </div>
          <div
            className={`relative w-10 h-5 rounded-full transition-colors ${
              giftWrap ? 'bg-[#722F37]' : 'bg-gray-300'
            }`}
            onClick={() => onGiftWrapChange?.(!giftWrap)}
          >
            <div
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
                giftWrap ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </div>
        </label>

        {giftWrap && (
          <textarea
            placeholder="Add a gift message (optional)"
            value={giftMessage}
            onChange={(e) => onGiftMessageChange?.(e.target.value)}
            maxLength={200}
            rows={2}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20 resize-none"
          />
        )}
      </div>

      {/* Shipping insurance toggle */}
      <label className="flex items-center justify-between cursor-pointer group">
        <div className="flex items-center gap-3">
          <Shield className="h-5 w-5 text-[#B76E79]" />
          <div>
            <p className="text-sm font-medium text-gray-900 group-hover:text-[#722F37] transition-colors">
              Shipping Insurance
            </p>
            <p className="text-xs text-gray-400">
              Protects against loss or damage during transit
            </p>
            {showInsuranceRecommendation && !shippingInsurance && (
              <p className="text-xs text-[#D4AF37] font-medium mt-0.5">
                Recommended for orders above {formatCurrency(INSURANCE_THRESHOLD)}
              </p>
            )}
          </div>
        </div>
        <div
          className={`relative w-10 h-5 rounded-full transition-colors ${
            shippingInsurance ? 'bg-[#722F37]' : 'bg-gray-300'
          }`}
          onClick={() => onShippingInsuranceChange?.(!shippingInsurance)}
        >
          <div
            className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${
              shippingInsurance ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </label>

      {/* COD availability */}
      <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
        {info?.codAvailable !== false ? (
          <>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
            <span className="text-xs text-emerald-600 font-medium">
              Cash on Delivery available for this pincode
            </span>
          </>
        ) : (
          <>
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span className="text-xs text-amber-600 font-medium">
              Cash on Delivery not available for this pincode
            </span>
          </>
        )}
      </div>
    </div>
  );
}
