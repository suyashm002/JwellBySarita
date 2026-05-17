'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search, X } from 'lucide-react';
import { productAPI } from '@/lib/api';
import { ProductGrid } from '@/components/product/ProductGrid';
import { useDebounce } from '@/hooks/useDebounce';
import type { Product } from '@/types/product';

export default function SearchPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(!!initialQuery);

  const debouncedQuery = useDebounce(query, 400);

  // Update URL when query changes
  useEffect(() => {
    if (debouncedQuery.trim()) {
      const params = new URLSearchParams();
      params.set('q', debouncedQuery.trim());
      router.replace(`/search?${params.toString()}`, { scroll: false });
    }
  }, [debouncedQuery, router]);

  // Fetch search results
  useEffect(() => {
    const searchProducts = async () => {
      const trimmed = debouncedQuery.trim();
      if (!trimmed) {
        setProducts([]);
        setHasSearched(false);
        return;
      }

      setIsLoading(true);
      setHasSearched(true);
      try {
        const { data } = await productAPI.search(trimmed);
        setProducts(data.data || []);
      } catch {
        setProducts([]);
      } finally {
        setIsLoading(false);
      }
    };

    searchProducts();
  }, [debouncedQuery]);

  const clearSearch = () => {
    setQuery('');
    setProducts([]);
    setHasSearched(false);
    router.replace('/search', { scroll: false });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Search input */}
      <div className="mb-10 max-w-2xl mx-auto">
        <h1 className="font-serif text-2xl font-bold text-center text-[#722F37] mb-6">
          Search Our Collection
        </h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search for rings, earrings, pendants, gemstones..."
            className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-12 pr-12 text-base text-gray-900 placeholder:text-gray-400 shadow-sm focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20 transition-all"
            autoFocus
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Results */}
      {hasSearched && (
        <div>
          {!isLoading && products.length > 0 && (
            <p className="mb-4 text-sm text-gray-500">
              {products.length} result{products.length !== 1 ? 's' : ''} for{' '}
              <span className="font-medium text-gray-700">
                &ldquo;{debouncedQuery.trim()}&rdquo;
              </span>
            </p>
          )}

          {!isLoading && products.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <Search className="h-16 w-16 text-gray-200 mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-1">
                No results found
              </h3>
              <p className="text-sm text-gray-500 max-w-sm">
                We couldn&apos;t find any products matching{' '}
                <span className="font-medium">
                  &ldquo;{debouncedQuery.trim()}&rdquo;
                </span>
                . Try a different search term or browse our catalogue.
              </p>
            </div>
          )}

          <ProductGrid products={products} isLoading={isLoading} />
        </div>
      )}

      {/* Initial state when no search yet */}
      {!hasSearched && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Search className="h-16 w-16 text-gray-200 mb-4" />
          <p className="text-sm text-gray-500">
            Start typing to search our collection of handcrafted silver jewellery
          </p>
        </div>
      )}
    </div>
  );
}
