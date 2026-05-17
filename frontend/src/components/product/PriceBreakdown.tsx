'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatWeight } from '@/lib/utils';
import type { PriceBreakdown as PriceBreakdownType } from '@/types/product';

interface PriceBreakdownProps {
  pricing: PriceBreakdownType;
  silverWeightGrams?: number;
  gemstoneCaratWeight?: number;
}

export function PriceBreakdown({
  pricing,
  silverWeightGrams,
  gemstoneCaratWeight,
}: PriceBreakdownProps) {
  const [expanded, setExpanded] = useState(false);

  const silverRatePerGram = pricing.silverRateUsed;
  const gemstoneRatePerCarat =
    gemstoneCaratWeight && gemstoneCaratWeight > 0
      ? pricing.gemstoneCost / gemstoneCaratWeight
      : 0;

  return (
    <div className="rounded-lg border border-gray-100 bg-white">
      {/* Collapsed: total price */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex w-full items-center justify-between px-4 py-3 text-left"
        type="button"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl font-bold text-[#722F37] font-serif">
            {formatCurrency(pricing.total)}
          </span>
          <span className="text-xs text-gray-500">(incl. GST)</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-[#B76E79] font-medium">
          <Info className="h-3.5 w-3.5" />
          Price Breakdown
          {expanded ? (
            <ChevronUp className="h-3.5 w-3.5" />
          ) : (
            <ChevronDown className="h-3.5 w-3.5" />
          )}
        </div>
      </button>

      {/* Expanded: breakdown */}
      <div
        className={cn(
          'overflow-hidden transition-all duration-300',
          expanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
        )}
      >
        <div className="border-t border-gray-100 px-4 py-3 space-y-2 text-sm">
          {/* Silver cost */}
          <div className="flex items-center justify-between text-gray-600">
            <span>
              Silver
              {silverWeightGrams
                ? `: ${formatWeight(silverWeightGrams)} x ${formatCurrency(silverRatePerGram)}/g`
                : ''}
            </span>
            <span className="font-medium text-gray-800">
              {formatCurrency(pricing.silverCost)}
            </span>
          </div>

          {/* Gemstone cost */}
          {pricing.gemstoneCost > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>
                Gemstone
                {gemstoneCaratWeight
                  ? `: ${gemstoneCaratWeight.toFixed(2)} ct x ${formatCurrency(gemstoneRatePerCarat)}/ct`
                  : ''}
              </span>
              <span className="font-medium text-gray-800">
                {formatCurrency(pricing.gemstoneCost)}
              </span>
            </div>
          )}

          {/* Making charges */}
          <div className="flex items-center justify-between text-gray-600">
            <span>Making Charges</span>
            <span className="font-medium text-gray-800">
              {formatCurrency(pricing.makingCharge)}
            </span>
          </div>

          {/* Additional charges */}
          {pricing.additionalCharges > 0 && (
            <div className="flex items-center justify-between text-gray-600">
              <span>Certification & Packaging</span>
              <span className="font-medium text-gray-800">
                {formatCurrency(pricing.additionalCharges)}
              </span>
            </div>
          )}

          {/* Subtotal */}
          <div className="flex items-center justify-between border-t border-dashed border-gray-200 pt-2 text-gray-700">
            <span className="font-medium">Subtotal</span>
            <span className="font-medium">
              {formatCurrency(pricing.subtotal)}
            </span>
          </div>

          {/* GST */}
          <div className="flex items-center justify-between text-gray-600">
            <span>
              GST (3%)
              <span className="text-xs text-gray-400 ml-1">
                CGST 1.5% + SGST 1.5%
              </span>
            </span>
            <span className="font-medium text-gray-800">
              {formatCurrency(pricing.totalGst)}
            </span>
          </div>

          {/* Total */}
          <div className="flex items-center justify-between border-t border-gray-200 pt-2">
            <span className="font-bold text-gray-900">Total</span>
            <span className="text-lg font-bold text-[#722F37]">
              {formatCurrency(pricing.total)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
