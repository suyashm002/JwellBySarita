'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { X, ShoppingBag, Timer } from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useSilverRateStore } from '@/stores/silverRateStore';
import { CartItemRow } from './CartItem';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { PRICE_LOCK_MINUTES } from '@/lib/constants';
import { cn } from '@/lib/utils';

export function CartDrawer() {
  const {
    items,
    itemCount,
    isOpen,
    closeCart,
    updateQuantity,
    removeItem,
    isLoading,
  } = useCartStore();
  const { rate } = useSilverRateStore();

  // Price lock countdown
  const [lockRemaining, setLockRemaining] = useState<string | null>(null);

  const priceLockExpiresAt = items[0]?.lockedAt
    ? new Date(new Date(items[0].lockedAt).getTime() + PRICE_LOCK_MINUTES * 60 * 1000)
    : null;

  const updateCountdown = useCallback(() => {
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
  }, [priceLockExpiresAt]);

  useEffect(() => {
    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [updateCountdown]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const subtotal = items.reduce((sum, item) => {
    const price = item.pricing?.total ?? item.product.pricing?.total ?? 0;
    return sum + price * item.quantity;
  }, 0);

  return (
    <>
      {/* Backdrop */}
      <div
        className={cn(
          'fixed inset-0 bg-black/40 z-[60] transition-opacity duration-300',
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        )}
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer */}
      <aside
        className={cn(
          'fixed top-0 right-0 h-full w-full max-w-[400px] bg-white z-[70] shadow-2xl flex flex-col transition-transform duration-300 ease-in-out',
          isOpen ? 'translate-x-0' : 'translate-x-full'
        )}
        aria-label="Shopping cart"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5 text-[#722F37]" />
            <h2 className="text-lg font-semibold text-gray-900">
              Your Cart
              <span className="text-sm font-normal text-gray-500 ml-1">
                ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </span>
            </h2>
          </div>
          <button
            onClick={closeCart}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
            aria-label="Close cart"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Silver rate banner */}
        {rate && (
          <div className="mx-5 mt-3 px-3 py-2 bg-[#D4AF37]/10 border border-[#D4AF37]/30 rounded-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="text-[#722F37] font-medium">
                Prices locked at {formatCurrency(rate.effectiveRate)}/g
              </span>
              {lockRemaining && (
                <span className="flex items-center gap-1 text-[#B76E79] font-semibold">
                  <Timer className="h-3.5 w-3.5" />
                  {lockRemaining}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Cart items */}
        <div className="flex-1 overflow-y-auto px-5">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-[#B76E79] border-t-transparent" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <ShoppingBag className="h-16 w-16 text-gray-200 mb-4" />
              <p className="text-gray-500 font-medium mb-1">Your cart is empty</p>
              <p className="text-sm text-gray-400 mb-6">
                Add some beautiful jewellery to get started
              </p>
              <Link href="/shop" onClick={closeCart}>
                <Button variant="secondary" size="sm">
                  Continue Shopping
                </Button>
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {items.map((item) => (
                <CartItemRow
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeItem}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t border-gray-100 px-5 py-4 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Subtotal</span>
              <span className="text-lg font-bold text-[#722F37]">
                {formatCurrency(subtotal)}
              </span>
            </div>
            <p className="text-xs text-gray-400">
              Shipping & taxes calculated at checkout
            </p>
            <div className="flex gap-2">
              <Link href="/cart" onClick={closeCart} className="flex-1">
                <Button variant="secondary" className="w-full" size="md">
                  View Cart
                </Button>
              </Link>
              <Link href="/checkout" onClick={closeCart} className="flex-1">
                <Button variant="primary" className="w-full" size="md">
                  Checkout
                </Button>
              </Link>
            </div>
          </div>
        )}
      </aside>
    </>
  );
}
