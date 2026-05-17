'use client';

import React from 'react';
import Link from 'next/link';
import { PRODUCT_TYPES } from '@/lib/constants';

const categoryColors = [
  'from-rose-100 to-rose-50',
  'from-amber-100 to-amber-50',
  'from-emerald-100 to-emerald-50',
  'from-sky-100 to-sky-50',
  'from-violet-100 to-violet-50',
  'from-pink-100 to-pink-50',
  'from-teal-100 to-teal-50',
  'from-orange-100 to-orange-50',
];

const categoryIcons: Record<string, string> = {
  rings: '💍',
  earrings: '✨',
  pendants: '📿',
  bracelets: '⭐',
  anklets: '🌸',
  bangles: '🔮',
  idols: '🕉️',
  gifting: '🎁',
};

export default function CategoryShowcase() {
  return (
    <section className="py-14 md:py-20">
      <div className="container-wide">
        {/* Heading */}
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
            Shop by Category
          </h2>
          <p className="mt-2 text-gray-500">
            Find the perfect piece for every occasion
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-6">
          {PRODUCT_TYPES.map((cat, idx) => (
            <Link
              key={cat.slug}
              href={`/category/${cat.slug}`}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div
                className={`flex aspect-square flex-col items-center justify-center bg-gradient-to-br p-6 transition-all duration-300 group-hover:scale-[1.02] group-hover:shadow-lg ${
                  categoryColors[idx % categoryColors.length]
                }`}
              >
                {/* Icon */}
                <span className="text-4xl sm:text-5xl">
                  {categoryIcons[cat.slug] || '💎'}
                </span>

                {/* Name */}
                <h3 className="mt-4 text-sm font-semibold text-gray-800 sm:text-base">
                  {cat.name}
                </h3>

                {/* Hover underline */}
                <div className="mt-2 h-0.5 w-0 bg-[#B76E79] transition-all duration-300 group-hover:w-12" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
