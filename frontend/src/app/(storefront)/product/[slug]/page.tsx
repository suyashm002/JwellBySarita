'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ChevronRight,
  Heart,
  ShoppingBag,
  Minus,
  Plus,
  ShieldCheck,
  Award,
  RotateCcw,
  Truck,
} from 'lucide-react';
import { productAPI, wishlistAPI } from '@/lib/api';
import { formatCurrency, formatWeight } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ProductGallery } from '@/components/product/ProductGallery';
import { PriceBreakdown } from '@/components/product/PriceBreakdown';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useCartStore } from '@/stores/cartStore';
import type { Product } from '@/types/product';
import toast from 'react-hot-toast';

const TRUST_BADGES = [
  { icon: ShieldCheck, label: 'BIS Hallmark', sub: 'Certified' },
  { icon: Award, label: 'Certified', sub: 'Gemstones' },
  { icon: RotateCcw, label: '7-Day', sub: 'Returns' },
  { icon: Truck, label: 'Insured', sub: 'Shipping' },
];

export default function ProductDetailPage() {
  const params = useParams();
  const slug = params.slug as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<string | undefined>();
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);

  const addItem = useCartStore((s) => s.addItem);

  // Fetch product
  useEffect(() => {
    const fetchProduct = async () => {
      setIsLoading(true);
      try {
        const { data } = await productAPI.getBySlug(slug);
        const prod: Product = data.data;
        setProduct(prod);

        // Auto-select first variant
        if (prod.variants && prod.variants.length > 0) {
          setSelectedVariant(prod.variants[0].id);
        }

        // Fetch related
        productAPI
          .getRelated(prod.id, 4)
          .then((res) => setRelatedProducts(res.data.data || []))
          .catch(() => {});

        // Track recently viewed in localStorage
        try {
          const rvKey = 'jewelup_recently_viewed';
          const existing: Product[] = JSON.parse(localStorage.getItem(rvKey) || '[]');
          const filtered = existing.filter((p) => p.id !== prod.id);
          const updated = [prod, ...filtered].slice(0, 10);
          localStorage.setItem(rvKey, JSON.stringify(updated));
        } catch {}
      } catch {
        setProduct(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProduct();
  }, [slug]);

  // Load recently viewed
  useEffect(() => {
    try {
      const rvKey = 'jewelup_recently_viewed';
      const items: Product[] = JSON.parse(localStorage.getItem(rvKey) || '[]');
      // Exclude current product
      setRecentlyViewed(items.filter((p) => p.slug !== slug).slice(0, 4));
    } catch {}
  }, [slug]);

  const handleAddToCart = async () => {
    if (!product) return;
    setAddingToCart(true);
    try {
      await addItem(product.id, quantity, selectedVariant);
    } finally {
      setAddingToCart(false);
    }
  };

  const handleToggleWishlist = async () => {
    if (!product) return;
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

  if (isLoading) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="animate-pulse grid grid-cols-1 gap-10 lg:grid-cols-2">
          <div className="aspect-square rounded-xl bg-gray-200" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 rounded bg-gray-200" />
            <div className="h-6 w-1/3 rounded bg-gray-200" />
            <div className="h-4 w-1/2 rounded bg-gray-200" />
            <div className="h-12 w-48 rounded bg-gray-200" />
            <div className="h-4 w-full rounded bg-gray-200" />
            <div className="h-4 w-5/6 rounded bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center">
        <h2 className="text-2xl font-bold text-gray-700">Product not found</h2>
        <p className="mt-2 text-gray-500">
          The product you are looking for does not exist or has been removed.
        </p>
        <Link href="/catalogue">
          <Button variant="primary" className="mt-6">
            Browse Collection
          </Button>
        </Link>
      </div>
    );
  }

  const purityLabel =
    product.silverPurity === 'STERLING_925' ? '925 Sterling Silver' : '999 Fine Silver';

  const totalGemstoneCarats = product.gemstones.reduce(
    (sum, g) => sum + g.caratWeight * g.quantity,
    0
  );

  const activeVariants = product.variants?.filter((v) => v.isActive) || [];
  const variantsByType = activeVariants.reduce<Record<string, typeof activeVariants>>(
    (acc, v) => {
      if (!acc[v.type]) acc[v.type] = [];
      acc[v.type].push(v);
      return acc;
    },
    {}
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1.5 text-sm text-gray-500">
        <Link href="/" className="hover:text-[#722F37] transition-colors">
          Home
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href="/catalogue" className="hover:text-[#722F37] transition-colors">
          Catalogue
        </Link>
        {product.category && (
          <>
            <ChevronRight className="h-3.5 w-3.5" />
            <Link
              href={`/category/${product.category.slug}`}
              className="hover:text-[#722F37] transition-colors"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#722F37] font-medium truncate max-w-[200px]">
          {product.name}
        </span>
      </nav>

      {/* Product detail: 2-column layout */}
      <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
        {/* Left: Gallery */}
        <ProductGallery images={product.images} />

        {/* Right: Details */}
        <div className="space-y-6">
          {/* Name */}
          <div>
            <div className="flex items-center gap-2 mb-2">
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
            </div>
            <h1 className="font-serif text-2xl font-bold text-gray-900 sm:text-3xl">
              {product.name}
            </h1>
            {product.shortDescription && (
              <p className="mt-2 text-sm text-gray-500 leading-relaxed">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Price with breakdown */}
          {product.pricing && (
            <PriceBreakdown
              pricing={product.pricing}
              silverWeightGrams={product.silverWeightGrams}
              gemstoneCaratWeight={totalGemstoneCarats > 0 ? totalGemstoneCarats : undefined}
            />
          )}

          {/* Silver purity & weight */}
          <div className="flex flex-wrap items-center gap-3">
            <Badge variant="default">{purityLabel}</Badge>
            <span className="text-sm text-gray-600">
              Wt: {formatWeight(product.silverWeightGrams)}
            </span>
            {product.stock > 0 && product.stock <= product.lowStockThreshold && (
              <Badge variant="warning">Only {product.stock} left</Badge>
            )}
            {product.stock === 0 && (
              <Badge variant="danger">Out of Stock</Badge>
            )}
          </div>

          {/* Gemstone details */}
          {product.gemstones.length > 0 && (
            <div className="rounded-lg border border-gray-100 p-4 space-y-2">
              <h3 className="text-sm font-semibold text-gray-800">
                Gemstone Details
              </h3>
              {product.gemstones.map((gem) => (
                <div
                  key={gem.id}
                  className="flex items-center justify-between text-sm text-gray-600"
                >
                  <span>
                    {gem.gemstoneRate.name} ({gem.gemstoneRate.qualityGrade})
                  </span>
                  <span>
                    {gem.caratWeight} ct x {gem.quantity} pcs
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Variant selector */}
          {Object.entries(variantsByType).map(([type, variants]) => (
            <div key={type}>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'RING_SIZE'
                  ? 'Ring Size'
                  : type === 'CHAIN_LENGTH'
                  ? 'Chain Length'
                  : type}
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => setSelectedVariant(e.target.value)}
                className="w-full rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-sm text-gray-700 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20"
              >
                {variants.map((v) => (
                  <option key={v.id} value={v.id} disabled={v.stock === 0}>
                    {v.value}
                    {v.additionalPrice > 0
                      ? ` (+${formatCurrency(v.additionalPrice)})`
                      : ''}
                    {v.stock === 0 ? ' — Out of Stock' : ''}
                  </option>
                ))}
              </select>
            </div>
          ))}

          {/* Quantity selector */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center gap-3 w-fit">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                disabled={quantity <= 1}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Minus className="h-4 w-4" />
              </button>
              <span className="w-10 text-center text-base font-medium">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.min(product.stock, q + 1))}
                disabled={quantity >= product.stock}
                className="flex h-10 w-10 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-colors"
              >
                <Plus className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Add to cart & wishlist */}
          <div className="flex items-center gap-3">
            <Button
              onClick={handleAddToCart}
              loading={addingToCart}
              disabled={product.stock === 0}
              size="lg"
              className="flex-1 gap-2 text-base"
            >
              <ShoppingBag className="h-5 w-5" />
              {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
            </Button>
            <button
              onClick={handleToggleWishlist}
              className={`flex h-12 w-12 items-center justify-center rounded-lg border-2 transition-all ${
                isWishlisted
                  ? 'border-[#B76E79] bg-[#B76E79]/5'
                  : 'border-gray-200 hover:border-[#B76E79]'
              }`}
              aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            >
              <Heart
                className={`h-5 w-5 ${
                  isWishlisted ? 'fill-[#B76E79] text-[#B76E79]' : 'text-gray-400'
                }`}
              />
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-4 gap-3 rounded-lg border border-gray-100 p-4">
            {TRUST_BADGES.map((badge) => (
              <div key={badge.label} className="flex flex-col items-center text-center gap-1">
                <badge.icon className="h-5 w-5 text-[#D4AF37]" />
                <span className="text-[11px] font-medium text-gray-700 leading-tight">
                  {badge.label}
                </span>
                <span className="text-[10px] text-gray-400">{badge.sub}</span>
              </div>
            ))}
          </div>

          {/* Specifications table */}
          <div className="rounded-lg border border-gray-100 overflow-hidden">
            <h3 className="bg-gray-50 px-4 py-2.5 text-sm font-semibold text-gray-800 border-b border-gray-100">
              Specifications
            </h3>
            <table className="w-full text-sm">
              <tbody>
                <tr className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-500 w-1/3">Silver Purity</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium">{purityLabel}</td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">Gross Weight</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium">
                    {formatWeight(product.silverWeightGrams)}
                  </td>
                </tr>
                <tr className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">Net Silver Weight</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium">
                    {formatWeight(product.silverWeightGrams)}
                  </td>
                </tr>
                {product.gemstones.length > 0 && (
                  <tr className="border-b border-gray-50">
                    <td className="px-4 py-2.5 text-gray-500">Stone Details</td>
                    <td className="px-4 py-2.5 text-gray-800 font-medium">
                      {product.gemstones
                        .map(
                          (g) =>
                            `${g.gemstoneRate.name} (${g.caratWeight} ct x ${g.quantity})`
                        )
                        .join(', ')}
                    </td>
                  </tr>
                )}
                <tr className="border-b border-gray-50">
                  <td className="px-4 py-2.5 text-gray-500">SKU</td>
                  <td className="px-4 py-2.5 text-gray-800 font-medium">{product.sku}</td>
                </tr>
                {product.category && (
                  <tr>
                    <td className="px-4 py-2.5 text-gray-500">Category</td>
                    <td className="px-4 py-2.5 text-gray-800 font-medium">
                      {product.category.name}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Full description */}
      {product.description && (
        <div className="mt-12 prose prose-sm max-w-none text-gray-600">
          <h2 className="font-serif text-xl font-bold text-gray-900 mb-4">
            About This Product
          </h2>
          <div dangerouslySetInnerHTML={{ __html: product.description }} />
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
            You May Also Like
          </h2>
          <ProductGrid products={relatedProducts} />
        </div>
      )}

      {/* Recently Viewed */}
      {recentlyViewed.length > 0 && (
        <div className="mt-16">
          <h2 className="font-serif text-2xl font-bold text-gray-900 mb-6">
            Recently Viewed
          </h2>
          <ProductGrid products={recentlyViewed} />
        </div>
      )}
    </div>
  );
}
