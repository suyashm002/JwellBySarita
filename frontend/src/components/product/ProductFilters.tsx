'use client';

import React, { useState, useCallback } from 'react';
import {
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SILVER_PURITY, GEMSTONE_TYPES } from '@/lib/constants';
import type { Category } from '@/types/product';

export interface FilterState {
  categoryId?: string;
  silverPurity?: string;
  gemstoneTypes: string[];
  minPrice?: number;
  maxPrice?: number;
  minWeight?: number;
  maxWeight?: number;
}

interface ProductFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  categories?: Category[];
}

/* ---------- Collapsible section ---------- */
function FilterSection({
  title,
  defaultOpen = true,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-gray-100 py-4 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between text-sm font-semibold text-gray-800"
      >
        {title}
        {open ? (
          <ChevronUp className="h-4 w-4 text-gray-400" />
        ) : (
          <ChevronDown className="h-4 w-4 text-gray-400" />
        )}
      </button>
      {open && <div className="mt-3 space-y-2">{children}</div>}
    </div>
  );
}

/* ---------- Filter content shared between desktop and mobile ---------- */
function FilterContent({
  filters,
  onFilterChange,
  categories = [],
}: ProductFiltersProps) {
  const handleCategoryToggle = (catId: string) => {
    onFilterChange({
      ...filters,
      categoryId: filters.categoryId === catId ? undefined : catId,
    });
  };

  const handlePurityChange = (value: string) => {
    onFilterChange({
      ...filters,
      silverPurity: filters.silverPurity === value ? undefined : value,
    });
  };

  const handleGemstoneToggle = (gem: string) => {
    const current = filters.gemstoneTypes || [];
    const updated = current.includes(gem)
      ? current.filter((g) => g !== gem)
      : [...current, gem];
    onFilterChange({ ...filters, gemstoneTypes: updated });
  };

  const handlePriceChange = (field: 'minPrice' | 'maxPrice', val: string) => {
    onFilterChange({
      ...filters,
      [field]: val ? Number(val) : undefined,
    });
  };

  const handleWeightChange = (field: 'minWeight' | 'maxWeight', val: string) => {
    onFilterChange({
      ...filters,
      [field]: val ? Number(val) : undefined,
    });
  };

  const clearAll = () => {
    onFilterChange({
      categoryId: undefined,
      silverPurity: undefined,
      gemstoneTypes: [],
      minPrice: undefined,
      maxPrice: undefined,
      minWeight: undefined,
      maxWeight: undefined,
    });
  };

  const hasActiveFilters =
    filters.categoryId ||
    filters.silverPurity ||
    (filters.gemstoneTypes && filters.gemstoneTypes.length > 0) ||
    filters.minPrice !== undefined ||
    filters.maxPrice !== undefined ||
    filters.minWeight !== undefined ||
    filters.maxWeight !== undefined;

  return (
    <div className="space-y-0">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900 flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </h3>
        {hasActiveFilters && (
          <button
            onClick={clearAll}
            className="text-xs text-[#B76E79] hover:text-[#722F37] font-medium transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <FilterSection title="Categories">
          {categories.map((cat) => (
            <label
              key={cat.id}
              className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900"
            >
              <input
                type="checkbox"
                checked={filters.categoryId === cat.id}
                onChange={() => handleCategoryToggle(cat.id)}
                className="h-4 w-4 rounded border-gray-300 text-[#B76E79] focus:ring-[#B76E79]"
              />
              <span>{cat.name}</span>
              {cat._count?.products !== undefined && (
                <span className="ml-auto text-xs text-gray-400">
                  ({cat._count.products})
                </span>
              )}
            </label>
          ))}
        </FilterSection>
      )}

      {/* Silver Purity */}
      <FilterSection title="Silver Purity">
        {SILVER_PURITY.map((p) => (
          <label
            key={p.value}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <input
              type="radio"
              name="silverPurity"
              checked={filters.silverPurity === p.value}
              onChange={() => handlePurityChange(p.value)}
              className="h-4 w-4 border-gray-300 text-[#B76E79] focus:ring-[#B76E79]"
            />
            <span>{p.label}</span>
          </label>
        ))}
      </FilterSection>

      {/* Gemstone Type */}
      <FilterSection title="Gemstone Type" defaultOpen={false}>
        {GEMSTONE_TYPES.map((gem) => (
          <label
            key={gem.slug}
            className="flex cursor-pointer items-center gap-2.5 text-sm text-gray-600 hover:text-gray-900"
          >
            <input
              type="checkbox"
              checked={(filters.gemstoneTypes || []).includes(gem.slug)}
              onChange={() => handleGemstoneToggle(gem.slug)}
              className="h-4 w-4 rounded border-gray-300 text-[#B76E79] focus:ring-[#B76E79]"
            />
            <span>{gem.name}</span>
          </label>
        ))}
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price Range">
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minPrice ?? ''}
            onChange={(e) => handlePriceChange('minPrice', e.target.value)}
            className="h-9 text-xs"
          />
          <span className="text-gray-400 text-xs">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxPrice ?? ''}
            onChange={(e) => handlePriceChange('maxPrice', e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </FilterSection>

      {/* Weight Range */}
      <FilterSection title="Weight Range (grams)" defaultOpen={false}>
        <div className="flex items-center gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minWeight ?? ''}
            onChange={(e) => handleWeightChange('minWeight', e.target.value)}
            className="h-9 text-xs"
          />
          <span className="text-gray-400 text-xs">to</span>
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxWeight ?? ''}
            onChange={(e) => handleWeightChange('maxWeight', e.target.value)}
            className="h-9 text-xs"
          />
        </div>
      </FilterSection>
    </div>
  );
}

/* ---------- Main component: desktop sidebar + mobile drawer ---------- */
export function ProductFilters(props: ProductFiltersProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile trigger */}
      <div className="lg:hidden">
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setMobileOpen(true)}
          className="gap-1.5"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filters
        </Button>
      </div>

      {/* Mobile slide-out drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          {/* Panel */}
          <div className="absolute inset-y-0 left-0 w-80 max-w-[85vw] bg-white shadow-xl animate-in slide-in-from-left duration-300">
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <h2 className="font-semibold text-gray-900">Filters</h2>
              <button
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-y-auto p-4 h-[calc(100vh-57px)]">
              <FilterContent {...props} />
            </div>
          </div>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden lg:block w-64 shrink-0">
        <div className="sticky top-24 rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
          <FilterContent {...props} />
        </div>
      </aside>
    </>
  );
}
