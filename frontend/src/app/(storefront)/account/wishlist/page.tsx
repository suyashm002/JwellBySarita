'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Heart,
  ShoppingCart,
  Trash2,
  ChevronLeft,
  Gem,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useRequireAuth } from '@/hooks/useAuth';
import { wishlistAPI, cartAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import type { Product } from '@/types/product';
import { Button } from '@/components/ui/button';
import { Card, CardBody } from '@/components/ui/card';
import { Skeleton, SkeletonCard } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function WishlistPage() {
  useRequireAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const [addingToCartId, setAddingToCartId] = useState<string | null>(null);

  /* ---- Fetch ---- */
  const fetchWishlist = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await wishlistAPI.get();
      // API may return products directly or nested in a wishlist object
      const items: Product[] =
        res.data?.products ??
        res.data?.items?.map((i: any) => i.product) ??
        res.data ??
        [];
      setProducts(items);
    } catch {
      toast.error('Failed to load wishlist');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWishlist();
  }, [fetchWishlist]);

  /* ---- Remove ---- */
  const handleRemove = async (productId: string) => {
    try {
      setRemovingId(productId);
      await wishlistAPI.remove(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
      toast.success('Removed from wishlist');
    } catch {
      toast.error('Failed to remove item');
    } finally {
      setRemovingId(null);
    }
  };

  /* ---- Add to cart ---- */
  const handleAddToCart = async (productId: string) => {
    try {
      setAddingToCartId(productId);
      await cartAPI.addItem(productId, 1);
      toast.success('Added to cart');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAddingToCartId(null);
    }
  };

  /* ---- Helpers ---- */
  const getPrimaryImage = (product: Product) => {
    const primary = product.images?.find((img) => img.isPrimary);
    return primary?.url ?? product.images?.[0]?.url ?? null;
  };

  const getPrice = (product: Product) => {
    return product.pricing?.total ?? 0;
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto max-w-5xl space-y-6 px-4 py-12">
      {/* Header */}
      <div>
        <Link
          href="/account"
          className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#722F37]"
        >
          <ChevronLeft className="h-3 w-3" />
          My Account
        </Link>
        <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">
          My Wishlist
        </h1>
        {!loading && products.length > 0 && (
          <p className="mt-1 text-sm text-gray-500">
            {products.length} {products.length === 1 ? 'item' : 'items'}
          </p>
        )}
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!loading && products.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-pink-50">
              <Heart className="h-8 w-8 text-pink-400" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">
              Your wishlist is empty
            </h2>
            <p className="max-w-sm text-sm text-gray-500">
              Save pieces you love by tapping the heart icon. They will show up here so
              you can easily find them later.
            </p>
            <Link href="/shop">
              <Button>
                <Gem className="h-4 w-4" />
                Browse Jewellery
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Product grid */}
      {!loading && products.length > 0 && (
        <div className="grid gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => {
            const image = getPrimaryImage(product);
            const price = getPrice(product);
            return (
              <Card
                key={product.id}
                className="group overflow-hidden border-gray-100"
              >
                {/* Image */}
                <Link href={`/product/${product.slug}`} className="block">
                  <div className="relative aspect-square overflow-hidden bg-gray-100">
                    {image ? (
                      <img
                        src={image}
                        alt={product.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Gem className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                  </div>
                </Link>

                <CardBody className="space-y-3">
                  {/* Name */}
                  <Link href={`/product/${product.slug}`}>
                    <h3 className="line-clamp-2 text-sm font-semibold text-gray-900 transition-colors hover:text-[#722F37]">
                      {product.name}
                    </h3>
                  </Link>

                  {/* Price */}
                  {price > 0 && (
                    <p className="text-base font-bold text-[#722F37]">
                      {formatCurrency(price)}
                    </p>
                  )}

                  {/* Silver info */}
                  <p className="text-xs text-gray-400">
                    {product.silverPurity === 'STERLING_925'
                      ? '925 Sterling Silver'
                      : '999 Fine Silver'}{' '}
                    &middot; {product.silverWeightGrams}g
                  </p>

                  {/* Actions */}
                  <div className="flex gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1"
                      loading={addingToCartId === product.id}
                      onClick={() => handleAddToCart(product.id)}
                    >
                      <ShoppingCart className="h-3.5 w-3.5" />
                      Add to Cart
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      loading={removingId === product.id}
                      onClick={() => handleRemove(product.id)}
                      className="shrink-0 text-red-500 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
