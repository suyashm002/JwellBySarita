'use client';

import React, { useCallback, useEffect, useState } from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const slides = [
  {
    id: 1,
    gradient: 'from-[#722F37] via-[#8B3A43] to-[#5E262D]',
    heading: 'Timeless Silver Elegance',
    subtitle:
      'Handcrafted 925 Sterling Silver jewellery adorned with precious gemstones from Jaipur.',
    cta: 'Explore Collection',
    ctaLink: '/collections',
  },
  {
    id: 2,
    gradient: 'from-[#2D1F22] via-[#3D2A2E] to-[#1A1214]',
    heading: 'Bridal Jewellery',
    subtitle:
      'Make your special day unforgettable with our exquisite bridal collection.',
    cta: 'Shop Bridal',
    ctaLink: '/occasion/bridal',
  },
  {
    id: 3,
    gradient: 'from-[#4A3228] via-[#5C3E32] to-[#3A261E]',
    heading: 'Gemstone Treasures',
    subtitle:
      'Emeralds, rubies, sapphires and more, set in pure sterling silver.',
    cta: 'Discover Gemstones',
    ctaLink: '/gemstones',
  },
];

export default function HeroBanner() {
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: true });
  const [selectedIndex, setSelectedIndex] = useState(0);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on('select', onSelect);
    onSelect();
  }, [emblaApi, onSelect]);

  // Auto-play
  useEffect(() => {
    if (!emblaApi) return;
    const interval = setInterval(() => {
      emblaApi.scrollNext();
    }, 5000);
    return () => clearInterval(interval);
  }, [emblaApi]);

  const scrollTo = useCallback(
    (index: number) => emblaApi?.scrollTo(index),
    [emblaApi]
  );

  return (
    <section className="relative w-full overflow-hidden" ref={emblaRef}>
      <div className="flex">
        {slides.map((slide) => (
          <div
            key={slide.id}
            className="relative min-w-0 flex-[0_0_100%]"
          >
            {/* Background */}
            <div
              className={cn(
                'flex min-h-[400px] items-center justify-center bg-gradient-to-br px-6 py-20 sm:min-h-[480px] md:min-h-[540px] lg:min-h-[600px]',
                slide.gradient
              )}
            >
              {/* Decorative elements */}
              <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-[#D4AF37]" />
                <div className="absolute -bottom-16 -left-16 h-64 w-64 rounded-full bg-[#B76E79]" />
              </div>

              {/* Content */}
              <div className="relative z-10 mx-auto max-w-2xl text-center">
                <h2 className="font-heading text-3xl font-bold leading-tight text-white sm:text-4xl md:text-5xl lg:text-6xl">
                  {slide.heading}
                </h2>
                <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-white/80 sm:text-base md:text-lg">
                  {slide.subtitle}
                </p>
                <Link
                  href={slide.ctaLink}
                  className="mt-8 inline-block rounded-full bg-[#D4AF37] px-8 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:bg-[#C89B2A] hover:shadow-xl sm:px-10 sm:py-3.5 sm:text-base"
                >
                  {slide.cta}
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Dots */}
      <div className="absolute bottom-5 left-1/2 z-10 flex -translate-x-1/2 gap-2.5">
        {slides.map((_, idx) => (
          <button
            key={idx}
            onClick={() => scrollTo(idx)}
            className={cn(
              'h-2.5 rounded-full transition-all duration-300',
              selectedIndex === idx
                ? 'w-8 bg-[#D4AF37]'
                : 'w-2.5 bg-white/50 hover:bg-white/80'
            )}
            aria-label={`Go to slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
}
