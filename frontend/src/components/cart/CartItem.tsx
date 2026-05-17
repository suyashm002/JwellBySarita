'use client';

import React from 'react';
import Image from 'next/image';
import { Minus, Plus, Trash2, Bookmark } from 'lucide-react';
import { CartItem as CartItemType } from '@/types/cart';
import { formatCurrency } from '@/lib/utils';

interface CartItemProps {
  item: CartItemType;
  onUpdateQuantity: (itemId: string, quantity: number) => void;
  onRemove: (itemId: string) => void;
}

export function CartItemRow({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const primaryImage = item.product.images?.find((img) => img.isPrimary) || item.product.images?.[0];
  const imageUrl = primaryImage?.url || '/images/placeholder-product.png';

  const displayPrice = item.pricing?.total ?? item.product.pricing?.total ?? 0;
  const lineTotal = displayPrice * item.quantity;

  return (
    <div className="flex gap-3 py-4 border-b border-gray-100 last:border-b-0">
      {/* Thumbnail */}
      <div className="relative h-[60px] w-[60px] flex-shrink-0 overflow-hidden rounded-lg bg-gray-50 border border-gray-200">
        <Image
          src={imageUrl}
          alt={item.product.name}
          fill
          className="object-cover"
          sizes="60px"
        />
      </div>

      {/* Details */}
      <div className="flex flex-1 flex-col min-w-0">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {item.product.name}
            </h4>
            {item.variant && (
              <p className="text-xs text-gray-500 mt-0.5">
                {item.variant.type}: {item.variant.value}
              </p>
            )}
          </div>
          <p className="text-sm font-semibold text-[#722F37] whitespace-nowrap">
            {formatCurrency(lineTotal)}
          </p>
        </div>

        {/* Quantity controls */}
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
            <button
              onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
              disabled={item.quantity <= 1}
              className="flex items-center justify-center h-7 w-7 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="flex items-center justify-center h-7 w-8 text-sm font-medium text-gray-900 border-x border-gray-200">
              {item.quantity}
            </span>
            <button
              onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
              disabled={item.quantity >= item.product.stock}
              className="flex items-center justify-center h-7 w-7 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onRemove(item.id)}
              className="text-gray-400 hover:text-red-500 transition-colors"
              aria-label="Remove item"
            >
              <Trash2 className="h-4 w-4" />
            </button>
            <button
              className="text-xs text-[#B76E79] hover:text-[#722F37] transition-colors flex items-center gap-1"
              aria-label="Save for later"
            >
              <Bookmark className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Save</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
