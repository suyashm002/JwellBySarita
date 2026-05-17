'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { X, ChevronDown, Phone, Mail } from 'lucide-react';
import { PRODUCT_TYPES, OCCASIONS, GEMSTONE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const menuSections = [
  {
    label: 'Shop by Category',
    items: PRODUCT_TYPES.map((t) => ({ name: t.name, href: `/category/${t.slug}` })),
  },
  {
    label: 'Occasions',
    items: OCCASIONS.map((o) => ({ name: o.name, href: `/catalogue?category=${o.slug}` })),
  },
  {
    label: 'Gemstones',
    items: GEMSTONE_TYPES.map((g) => ({ name: g.name, href: `/catalogue?gemstoneType=${g.slug}` })),
  },
];

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const [openSection, setOpenSection] = useState<string | null>(null);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const toggleSection = (label: string) => {
    setOpenSection((prev) => (prev === label ? null : label));
  };

  return (
    <>
      {/* Overlay */}
      <div
        className={cn(
          'fixed inset-0 z-[60] bg-black/40 transition-opacity duration-300 lg:hidden',
          isOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        )}
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div
        className={cn(
          'fixed left-0 top-0 z-[70] h-full w-[300px] max-w-[85vw] bg-white shadow-2xl transition-transform duration-300 ease-in-out lg:hidden',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
          <Link href="/" onClick={onClose}>
            <h2 className="font-heading text-lg font-bold text-[#722F37]">
              Jewelup <span className="font-normal text-[#B76E79]">by Sarita</span>
            </h2>
          </Link>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-3">
          {/* Accordion Sections */}
          {menuSections.map((section) => (
            <div key={section.label} className="mb-1">
              <button
                onClick={() => toggleSection(section.label)}
                className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
              >
                {section.label}
                <ChevronDown
                  className={cn(
                    'h-4 w-4 text-gray-400 transition-transform duration-200',
                    openSection === section.label && 'rotate-180'
                  )}
                />
              </button>
              <div
                className={cn(
                  'overflow-hidden transition-all duration-200',
                  openSection === section.label ? 'max-h-[500px]' : 'max-h-0'
                )}
              >
                <ul className="pb-2 pl-3">
                  {section.items.map((item) => (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        onClick={onClose}
                        className="block rounded-lg px-3 py-2 text-sm text-gray-600 hover:bg-[#FDF2F4] hover:text-[#722F37] transition-colors"
                      >
                        {item.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}

          {/* Direct Links */}
          <div className="mt-1 border-t border-gray-100 pt-2">
            <Link
              href="/catalogue"
              onClick={onClose}
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              Collections
            </Link>
            <Link
              href="/catalogue?isNewArrival=true"
              onClick={onClose}
              className="block rounded-lg px-3 py-3 text-sm font-semibold text-gray-800 hover:bg-gray-50 transition-colors"
            >
              New Arrivals
            </Link>
          </div>

          {/* Account Links */}
          <div className="mt-2 border-t border-gray-100 pt-3">
            <Link
              href="/account"
              onClick={onClose}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              My Account
            </Link>
            <Link
              href="/account/orders"
              onClick={onClose}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              My Orders
            </Link>
            <Link
              href="/account/wishlist"
              onClick={onClose}
              className="block rounded-lg px-3 py-2.5 text-sm text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Wishlist
            </Link>
          </div>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-100 px-5 py-4">
          <a
            href="tel:+919876543210"
            className="flex items-center gap-2 py-1.5 text-sm text-gray-600 hover:text-[#722F37] transition-colors"
          >
            <Phone className="h-4 w-4" />
            +91 98765 43210
          </a>
          <a
            href="mailto:hello@jewelup.in"
            className="flex items-center gap-2 py-1.5 text-sm text-gray-600 hover:text-[#722F37] transition-colors"
          >
            <Mail className="h-4 w-4" />
            hello@jewelup.in
          </a>
        </div>
      </div>
    </>
  );
}
