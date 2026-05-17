'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Heart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/stores/cartStore';
import { wishlistAPI } from '@/lib/api';
import type { Product } from '@/types/product';
import toast from 'react-hot-toast';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const addItem = useCartStore((s) => s.addItem);

  const primaryImage = product.images.find((img) => img.isPrimary) || product.images[0];
  const imageUrl = primaryImage?.url || '/placeholder-product.jpg';

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setAddingToCart(true);
    try {
      await addItem(product.id);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      if (isWishlisted) {
        await wishlistAPI.remove(product.id);
        setIsWishlisted(false);
        toast.success('Removed from wishlist');
      } else {
        await wishlistAPI.add(product.id);
        setIsWishlisted(true);
        toast.success('Added to wishlist');
      }
    } catch {
      toast.error('Please login to manage wishlist');
    }
  };

  const purityLabel =
    product.silverPurity === 'STERLING_925' ? '925 Silver' : '999 Fine Silver';

  return (
    <Link
      href={`/product/${product.slug}`}
      className="group block rounded-xl border border-gray-100 bg-white shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
    >
      {/* Image container */}
      <div className="relative aspect-square overflow-hidden rounded-t-xl bg-gray-50">
        <div className="h-full w-full overflow-hidden">
          <Image
            src={imageUrl}
            alt={primaryImage?.altText || product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>

        {/* Badges */}
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {product.isNewArrival && (
            <Badge className="bg-[#D4AF37] text-white border-none text-[10px]">
              New Arrival
            </Badge>
          )}
          {product.isBestseller && (
            <Badge className="bg-[#722F37] text-white border-none text-[10px]">
              Bestseller
            </Badge>
          )}
          {product.stock > 0 && product.stock <= product.lowStockThreshold && (
            <Badge variant="warning" className="text-[10px]">
              Limited Stock
            </Badge>
          )}
        </div>

        {/* Wishlist button */}
        <button
          onClick={handleToggleWishlist}
          className="absolute right-2 top-2 rounded-full bg-white/80 p-2 shadow-sm backdrop-blur-sm transition-all hover:bg-white hover:scale-110"
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <Heart
            className={cn(
              'h-4 w-4 transition-colors',
              isWishlisted
                ? 'fill-[#B76E79] text-[#B76E79]'
                : 'text-gray-500 hover:text-[#B76E79]'
            )}
          />
        </button>

        {/* Quick add to cart */}
        <div className="absolute bottom-0 left-0 right-0 translate-y-full opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <Button
            onClick={handleAddToCart}
            loading={addingToCart}
            disabled={product.stock === 0}
            className="w-full rounded-none rounded-b-none bg-[#722F37] py-2.5 text-xs"
            size="sm"
          >
            <ShoppingBag className="h-3.5 w-3.5" />
            {product.stock === 0 ? 'Out of Stock' : 'Quick Add'}
          </Button>
        </div>
      </div>

      {/* Product info */}
      <div className="p-3 space-y-1.5">
        <h3 className="font-medium text-sm text-gray-900 line-clamp-2 leading-snug min-h-[2.5rem]">
          {product.name}
        </h3>

        <div className="flex items-center gap-2 text-[11px] text-gray-500">
          <span>{purityLabel}</span>
          <span className="text-gray-300">|</span>
          <span>{formatWeight(product.silverWeightGrams)}</span>
        </div>

        <div className="pt-1">
          <p className="text-base font-bold text-[#722F37]">
            {product.pricing
              ? formatCurrency(product.pricing.total)
              : 'Price on request'}
          </p>
        </div>
      </div>
    </Link>
  );
}
