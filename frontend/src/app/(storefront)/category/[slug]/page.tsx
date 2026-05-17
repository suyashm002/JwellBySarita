'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { productAPI, categoryAPI } from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductGrid';
import { Button } from '@/components/ui/button';
import type { Product, Category } from '@/types/product';

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'bestseller', label: 'Bestsellers' },
];

const ITEMS_PER_PAGE = 12;

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const slug = params.slug as string;

  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  const currentPage = Number(searchParams.get('page')) || 1;
  const currentSort = searchParams.get('sort') || 'newest';

  // Fetch category info
  useEffect(() => {
    categoryAPI
      .getBySlug(slug)
      .then((res) => setCategory(res.data.data))
      .catch(() => setCategory(null));
  }, [slug]);

  // Fetch products
  useEffect(() => {
    const fetchProducts = async () => {
      setIsLoading(true);
      try {
        let sortBy = 'createdAt';
        let sortOrder: 'asc' | 'desc' = 'desc';

        switch (currentSort) {
          case 'price-asc':
            sortBy = 'price';
            sortOrder = 'asc';
            break;
          case 'price-desc':
            sortBy = 'price';
            sortOrder = 'desc';
            break;
          case 'newest':
            sortBy = 'createdAt';
            sortOrder = 'desc';
            break;
          case 'bestseller':
            sortBy = 'bestseller';
            sortOrder = 'desc';
            break;
        }

        // We fetch by slug — the API resolves the category
        const apiParams: Record<string, any> = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          sortBy,
          sortOrder,
        };

        if (category?.id) {
          apiParams.categoryId = category.id;
        }

        const { data } = await productAPI.getAll(apiParams);
        setProducts(data.data?.products || data.data || []);
        setTotalPages(data.data?.totalPages || 1);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    if (category?.id) {
      fetchProducts();
    }
  }, [category?.id, currentPage, currentSort]);

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const params = new URLSearchParams();
    if (e.target.value !== 'newest') params.set('sort', e.target.value);
    const qs = params.toString();
    router.push(`/category/${slug}${qs ? `?${qs}` : ''}`, { scroll: false });
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams();
    if (page > 1) params.set('page', String(page));
    if (currentSort !== 'newest') params.set('sort', currentSort);
    const qs = params.toString();
    router.push(`/category/${slug}${qs ? `?${qs}` : ''}`, { scroll: false });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const categoryName = category?.name || slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

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
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-[#722F37] font-medium">{categoryName}</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#722F37]">
          {categoryName}
        </h1>
        {category?.description && (
          <p className="mt-2 text-sm text-gray-500 max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Sort bar */}
      <div className="mb-6 flex items-center justify-between gap-3">
        <p className="text-sm text-gray-500">
          {!isLoading && `${products.length} products`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={currentSort}
            onChange={handleSortChange}
            className="rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm text-gray-700 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20 appearance-none"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Product grid */}
      <ProductGrid products={products} isLoading={isLoading} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-10 flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage <= 1}
            onClick={() => handlePageChange(currentPage - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
            Prev
          </Button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((page) => {
              if (totalPages <= 7) return true;
              if (page === 1 || page === totalPages) return true;
              if (Math.abs(page - currentPage) <= 1) return true;
              return false;
            })
            .map((page, idx, arr) => {
              const showEllipsis = idx > 0 && page - arr[idx - 1] > 1;
              return (
                <React.Fragment key={page}>
                  {showEllipsis && (
                    <span className="px-1 text-gray-400">...</span>
                  )}
                  <button
                    onClick={() => handlePageChange(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? 'bg-[#722F37] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                </React.Fragment>
              );
            })}

          <Button
            variant="ghost"
            size="sm"
            disabled={currentPage >= totalPages}
            onClick={() => handlePageChange(currentPage + 1)}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  );
}
