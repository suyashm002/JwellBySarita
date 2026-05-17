'use client';

import React, { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { productAPI, categoryAPI } from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductGrid';
import { ProductFilters, type FilterState } from '@/components/product/ProductFilters';
import { Select } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import type { Product, Category } from '@/types/product';

const SORT_OPTIONS = [
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'newest', label: 'Newest First' },
  { value: 'bestseller', label: 'Bestsellers' },
];

const ITEMS_PER_PAGE = 12;

function CatalogueContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalPages, setTotalPages] = useState(1);

  // Read state from URL params
  const currentPage = Number(searchParams.get('page')) || 1;
  const currentSort = searchParams.get('sort') || 'newest';
  const [filters, setFilters] = useState<FilterState>({
    categoryId: searchParams.get('categoryId') || undefined,
    silverPurity: searchParams.get('silverPurity') || undefined,
    gemstoneTypes: searchParams.get('gemstoneTypes')?.split(',').filter(Boolean) || [],
    minPrice: searchParams.get('minPrice') ? Number(searchParams.get('minPrice')) : undefined,
    maxPrice: searchParams.get('maxPrice') ? Number(searchParams.get('maxPrice')) : undefined,
    minWeight: searchParams.get('minWeight') ? Number(searchParams.get('minWeight')) : undefined,
    maxWeight: searchParams.get('maxWeight') ? Number(searchParams.get('maxWeight')) : undefined,
  });

  // Build URL params from state
  const updateUrl = useCallback(
    (newFilters: FilterState, sort: string, page: number) => {
      const params = new URLSearchParams();
      if (page > 1) params.set('page', String(page));
      if (sort !== 'newest') params.set('sort', sort);
      if (newFilters.categoryId) params.set('categoryId', newFilters.categoryId);
      if (newFilters.silverPurity) params.set('silverPurity', newFilters.silverPurity);
      if (newFilters.gemstoneTypes?.length)
        params.set('gemstoneTypes', newFilters.gemstoneTypes.join(','));
      if (newFilters.minPrice !== undefined) params.set('minPrice', String(newFilters.minPrice));
      if (newFilters.maxPrice !== undefined) params.set('maxPrice', String(newFilters.maxPrice));
      if (newFilters.minWeight !== undefined) params.set('minWeight', String(newFilters.minWeight));
      if (newFilters.maxWeight !== undefined) params.set('maxWeight', String(newFilters.maxWeight));

      const qs = params.toString();
      router.push(`/catalogue${qs ? `?${qs}` : ''}`, { scroll: false });
    },
    [router]
  );

  // Fetch categories once
  useEffect(() => {
    categoryAPI
      .getAll('PRODUCT_TYPE')
      .then((res) => setCategories(res.data.data || []))
      .catch(() => {});
  }, []);

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

        const params: Record<string, any> = {
          page: currentPage,
          limit: ITEMS_PER_PAGE,
          sortBy,
          sortOrder,
        };

        if (filters.categoryId) params.categoryId = filters.categoryId;
        if (filters.silverPurity) params.silverPurity = filters.silverPurity;
        if (filters.gemstoneTypes?.length) params.gemstoneType = filters.gemstoneTypes.join(',');
        if (filters.minPrice !== undefined) params.minPrice = filters.minPrice;
        if (filters.maxPrice !== undefined) params.maxPrice = filters.maxPrice;

        const { data } = await productAPI.getAll(params);
        setProducts(data.data?.products || data.data || []);
        setTotalPages(data.data?.totalPages || 1);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProducts();
  }, [currentPage, currentSort, filters]);

  const handleFilterChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    updateUrl(newFilters, currentSort, 1);
  };

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateUrl(filters, e.target.value, 1);
  };

  const handlePageChange = (page: number) => {
    updateUrl(filters, currentSort, page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-[#722F37]">
          Our Collection
        </h1>
        <p className="mt-2 text-sm text-gray-500">
          Discover handcrafted silver and gemstone jewellery
        </p>
      </div>

      <div className="flex gap-8">
        {/* Sidebar filters */}
        <ProductFilters
          filters={filters}
          onFilterChange={handleFilterChange}
          categories={categories}
        />

        {/* Main content */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div className="lg:hidden">
              <ProductFilters
                filters={filters}
                onFilterChange={handleFilterChange}
                categories={categories}
              />
            </div>
            <div className="flex items-center gap-2 ml-auto">
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
      </div>
    </div>
  );
}

export default function CataloguePage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[50vh]"><div className="animate-spin h-8 w-8 border-4 border-[#722F37] border-t-transparent rounded-full" /></div>}>
      <CatalogueContent />
    </Suspense>
  );
}
