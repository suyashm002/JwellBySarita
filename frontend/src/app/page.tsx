'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Gem,
  Lock,
  Truck,
  RotateCcw,
  ArrowRight,
  Send,
} from 'lucide-react';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import HeroBanner from '@/components/home/HeroBanner';
import SilverRateTicker from '@/components/home/SilverRateTicker';
import CategoryShowcase from '@/components/home/CategoryShowcase';
import FeaturedProducts from '@/components/home/FeaturedProducts';
import { ProductCard } from '@/components/product/ProductCard';
import { SkeletonCard } from '@/components/ui/skeleton';
import { productAPI } from '@/lib/api';
import { useAuth } from '@/hooks/useAuth';
import { useCart } from '@/hooks/useCart';
import { GEMSTONE_TYPES } from '@/lib/constants';
import type { Product } from '@/types/product';

/* ── Trust Badges ── */
const trustBadges = [
  { icon: ShieldCheck, label: 'BIS Hallmark', desc: 'Certified purity guarantee' },
  { icon: Gem, label: 'Certified Gemstones', desc: 'Authentic, lab-tested stones' },
  { icon: Lock, label: 'Secure Payments', desc: '256-bit SSL encryption' },
  { icon: Truck, label: 'Insured Shipping', desc: 'Free on orders above Rs.2000' },
  { icon: RotateCcw, label: '7-Day Returns', desc: 'Hassle-free return policy' },
];

/* ── Gemstone colors for the exploration cards ── */
const gemstoneColors: Record<string, string> = {
  emerald: 'from-emerald-600 to-emerald-800',
  ruby: 'from-red-600 to-red-800',
  sapphire: 'from-blue-600 to-blue-800',
  topaz: 'from-amber-500 to-amber-700',
  garnet: 'from-rose-700 to-rose-900',
  amethyst: 'from-purple-600 to-purple-800',
  pearl: 'from-gray-200 to-gray-400',
  turquoise: 'from-teal-500 to-teal-700',
};

/* ── Bestsellers Section ── */
function Bestsellers() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productAPI
      .getBestsellers(8)
      .then(({ data }) => setProducts(data.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="py-14 md:py-20">
      <div className="container-wide">
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
              Bestsellers
            </h2>
            <p className="mt-2 text-gray-500">
              Our most loved pieces, chosen by thousands
            </p>
          </div>
          <Link
            href="/catalogue?bestseller=true"
            className="hidden items-center gap-1 text-sm font-semibold text-[#722F37] transition-colors hover:text-[#5e262d] sm:flex"
          >
            View All <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 md:gap-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Gemstone Exploration ── */
function GemstoneExploration() {
  return (
    <section className="bg-[#FDF8F5] py-14 md:py-20">
      <div className="container-wide">
        <div className="mb-10 text-center">
          <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
            Explore by Gemstone
          </h2>
          <p className="mt-2 text-gray-500">
            Discover jewellery set with your favourite precious stones
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 md:gap-5">
          {GEMSTONE_TYPES.map((gem) => (
            <Link
              key={gem.slug}
              href={`/catalogue?gemstoneType=${gem.slug}`}
              className="group relative overflow-hidden rounded-2xl"
            >
              <div
                className={`flex aspect-[4/3] flex-col items-center justify-center bg-gradient-to-br p-5 transition-all duration-300 group-hover:scale-[1.03] group-hover:shadow-xl ${
                  gemstoneColors[gem.slug] || 'from-gray-600 to-gray-800'
                }`}
              >
                <h3 className="text-lg font-semibold text-white sm:text-xl">
                  {gem.name}
                </h3>
                <span className="mt-2 text-xs font-medium text-white/70 transition-colors group-hover:text-white">
                  Explore Collection
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Trust Badges Band ── */
function TrustBadgesBand() {
  return (
    <section className="border-y border-gray-100 bg-white py-10 md:py-14">
      <div className="container-wide">
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-5 md:gap-8">
          {trustBadges.map((badge) => (
            <div
              key={badge.label}
              className="flex flex-col items-center gap-2.5 text-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FDF2F4]">
                <badge.icon className="h-7 w-7 text-[#B76E79]" />
              </div>
              <h4 className="text-sm font-semibold text-gray-900">
                {badge.label}
              </h4>
              <p className="text-xs text-gray-500">{badge.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ── Brand Story ── */
function BrandStory() {
  return (
    <section className="py-14 md:py-20">
      <div className="container-wide">
        <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#722F37] via-[#8B3A43] to-[#5E262D]">
          <div className="grid items-center md:grid-cols-2">
            {/* Visual side */}
            <div className="flex items-center justify-center bg-black/10 px-8 py-12 md:py-20">
              <div className="relative">
                <div className="h-64 w-64 rounded-full bg-[#D4AF37]/20 sm:h-72 sm:w-72" />
                <div className="absolute inset-4 rounded-full bg-[#B76E79]/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <span className="font-heading text-5xl font-bold text-white/90 sm:text-6xl">
                      J
                    </span>
                    <div className="mt-6 grid grid-cols-3 gap-4">
                      <div>
                        <p className="text-2xl font-heading font-bold text-[#D4AF37]">500+</p>
                        <p className="text-[10px] text-white/60">Designs</p>
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold text-[#D4AF37]">10K+</p>
                        <p className="text-[10px] text-white/60">Customers</p>
                      </div>
                      <div>
                        <p className="text-2xl font-heading font-bold text-[#D4AF37]">100%</p>
                        <p className="text-[10px] text-white/60">Certified</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Text side */}
            <div className="px-8 py-12 text-white md:px-12 md:py-16">
              <h2 className="font-heading text-3xl font-bold leading-tight md:text-4xl">
                Crafted in Jaipur,
                <br />
                Worn Worldwide
              </h2>
              <p className="mt-5 text-sm leading-relaxed text-white/80 md:text-base">
                Every piece at Jewelup by Sarita carries the legacy of Jaipur&apos;s
                finest artisans. From selecting the purest 925 Sterling Silver to
                hand-setting each gemstone, our jewellery is a testament to
                centuries of craftsmanship.
              </p>
              <p className="mt-4 text-sm leading-relaxed text-white/80 md:text-base">
                We believe that luxury should be accessible. That is why we bring
                you BIS-hallmarked, certified jewellery at honest prices -- directly
                from our workshops in Johari Bazaar to your doorstep.
              </p>
              <Link
                href="/about"
                className="mt-8 inline-flex items-center gap-2 rounded-full border-2 border-[#D4AF37] px-7 py-2.5 text-sm font-semibold text-[#D4AF37] transition-all hover:bg-[#D4AF37] hover:text-white"
              >
                Our Story <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ── Newsletter Section ── */
function Newsletter() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail('');
      setTimeout(() => setSubmitted(false), 5000);
    }
  };

  return (
    <section className="bg-[#FDF2F4] py-14 md:py-20">
      <div className="container-wide text-center">
        <h2 className="font-heading text-3xl font-bold text-gray-900 md:text-4xl">
          Stay in Touch
        </h2>
        <p className="mx-auto mt-3 max-w-md text-gray-500">
          Subscribe for exclusive offers, new arrivals, and jewellery styling tips
          delivered to your inbox.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mx-auto mt-8 flex max-w-md gap-2"
        >
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email"
            required
            className="flex-1 rounded-full border border-gray-300 bg-white px-5 py-3 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20"
          />
          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-full bg-[#722F37] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#5e262d]"
          >
            <Send className="h-4 w-4" />
            Subscribe
          </button>
        </form>

        {submitted && (
          <p className="mt-4 text-sm font-medium text-green-600">
            Thank you for subscribing! Check your inbox soon.
          </p>
        )}
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════
   HOMEPAGE
   ══════════════════════════════════════════════ */
export default function HomePage() {
  // Initialize global hooks
  useAuth();
  useCart();

  return (
    <>
      <Navbar />

      <main>
        {/* Hero Banner Carousel */}
        <HeroBanner />

        {/* Promotional Banner */}
        <SilverRateTicker />

        {/* Shop by Category */}
        <CategoryShowcase />

        {/* Featured Collection */}
        <FeaturedProducts />

        {/* Bestsellers */}
        <Bestsellers />

        {/* Explore by Gemstone */}
        <GemstoneExploration />

        {/* Trust Badges */}
        <TrustBadgesBand />

        {/* Brand Story */}
        <BrandStory />

        {/* Newsletter */}
        <Newsletter />
      </main>

      <Footer />
    </>
  );
}
