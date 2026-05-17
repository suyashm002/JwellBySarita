'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Product } from '@/types/product';
import { productAPI } from '@/lib/api';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/ui/skeleton';

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    productAPI
      .getFeatured(8)
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setIsLoading(false));
  }, []);

  return (
    <section className="bg-white py-14 md:py-20">
      <div className="container-wide">
        {/* Heading */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
              Featured Collection
            </h2>
            <p className="mt-2 text-gray-500">
              Curated pieces handpicked for you
            </p>
          </div>
          <Link
            href="/catalogue?featured=true"
            className="hidden items-center gap-1 text-sm font-semibold text-[#722F37] transition-colors hover:text-[#5e262d] sm:flex"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Products */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {/* Mobile View All */}
        <div className="mt-6 text-center sm:hidden">
          <Link
            href="/catalogue?featured=true"
            className="inline-flex items-center gap-1 text-sm font-semibold text-[#722F37]"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  );
}
