'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Heart,
  ShoppingBag,
  User,
  Menu,
  Phone,
  Mail,
  ChevronDown,
  LogOut,
  Package,
  UserCircle,
} from 'lucide-react';
import { useCartStore } from '@/stores/cartStore';
import { useAuthStore } from '@/stores/authStore';
import { PRODUCT_TYPES, OCCASIONS, GEMSTONE_TYPES } from '@/lib/constants';
import { cn } from '@/lib/utils';
import MobileMenu from './MobileMenu';

const navLinks = [
  {
    label: 'Shop by Category',
    href: '/catalogue',
    megaMenu: PRODUCT_TYPES.map((t) => ({ name: t.name, href: `/category/${t.slug}` })),
  },
  {
    label: 'Occasions',
    href: '/catalogue',
    megaMenu: OCCASIONS.map((o) => ({ name: o.name, href: `/catalogue?category=${o.slug}` })),
  },
  {
    label: 'Gemstones',
    href: '/catalogue',
    megaMenu: GEMSTONE_TYPES.map((g) => ({ name: g.name, href: `/catalogue?gemstoneType=${g.slug}` })),
  },
  { label: 'Collections', href: '/catalogue' },
  { label: 'New Arrivals', href: '/catalogue?isNewArrival=true' },
];

export default function Navbar() {
  const { itemCount } = useCartStore();
  const { user, isAuthenticated, logout } = useAuthStore();

  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const menuTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuEnter = (label: string) => {
    if (menuTimeoutRef.current) clearTimeout(menuTimeoutRef.current);
    setActiveMenu(label);
  };

  const handleMenuLeave = () => {
    menuTimeoutRef.current = setTimeout(() => setActiveMenu(null), 150);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery.trim())}`;
    }
  };

  const wishlistCount = 0; // TODO: from wishlist store

  return (
    <>
      <header
        className={cn(
          'sticky top-0 z-50 w-full transition-shadow duration-300',
          isScrolled ? 'shadow-lg' : ''
        )}
      >
        {/* Top Bar */}
        <div className="bg-[#722F37] text-white">
          <div className="container-wide flex items-center justify-between py-1.5 text-xs">
            <div className="flex items-center gap-4">
              <span className="font-medium">BIS Hallmarked Silver Jewellery</span>
            </div>
            <div className="hidden items-center gap-4 md:flex">
              <a href="tel:+919876543210" className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors">
                <Phone className="h-3 w-3" />
                <span>+91 98765 43210</span>
              </a>
              <a href="mailto:hello@jewelup.in" className="flex items-center gap-1 hover:text-[#D4AF37] transition-colors">
                <Mail className="h-3 w-3" />
                <span>hello@jewelup.in</span>
              </a>
            </div>
          </div>
        </div>

        {/* Main Bar */}
        <div className="bg-white/95 backdrop-blur-md border-b border-gray-100">
          <div className="container-wide flex items-center justify-between gap-4 py-3">
            {/* Hamburger (mobile) */}
            <button
              className="lg:hidden p-1.5 text-gray-700 hover:text-[#722F37] transition-colors"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            {/* Logo */}
            <Link href="/" className="flex-shrink-0">
              <h1 className="font-heading text-xl font-bold tracking-tight text-[#722F37] sm:text-2xl lg:text-[1.65rem]">
                Jewelup{' '}
                <span className="font-normal text-[#B76E79]">by Sarita</span>
              </h1>
            </Link>

            {/* Search Bar (desktop) */}
            <form
              onSubmit={handleSearch}
              className="hidden flex-1 max-w-lg lg:flex items-center"
            >
              <div className="relative w-full">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search rings, earrings, pendants..."
                  className="w-full rounded-full border border-gray-200 bg-gray-50 py-2 pl-10 pr-4 text-sm text-gray-900 placeholder:text-gray-400 transition-all focus:border-[#B76E79] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20"
                />
              </div>
            </form>

            {/* Right Icons */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Search icon (mobile) */}
              <Link
                href="/search"
                className="p-2 text-gray-600 hover:text-[#722F37] transition-colors lg:hidden"
                aria-label="Search"
              >
                <Search className="h-5 w-5" />
              </Link>

              {/* User */}
              <div className="relative" ref={userDropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="p-2 text-gray-600 hover:text-[#722F37] transition-colors"
                  aria-label={isAuthenticated ? 'Account menu' : 'Login'}
                >
                  <User className="h-5 w-5" />
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-gray-100 bg-white py-2 shadow-xl z-50">
                    {isAuthenticated && user ? (
                      <>
                        <div className="px-4 py-2 border-b border-gray-100">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {user.email || user.phone}
                          </p>
                        </div>
                        <Link
                          href="/account"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <UserCircle className="h-4 w-4" />
                          My Account
                        </Link>
                        <Link
                          href="/account/orders"
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          <Package className="h-4 w-4" />
                          My Orders
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setUserDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
                        >
                          <LogOut className="h-4 w-4" />
                          Logout
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          href="/login"
                          className="block px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          Login
                        </Link>
                        <Link
                          href="/register"
                          className="block px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                          onClick={() => setUserDropdownOpen(false)}
                        >
                          Create Account
                        </Link>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* Wishlist */}
              <Link
                href="/account/wishlist"
                className="relative p-2 text-gray-600 hover:text-[#722F37] transition-colors"
                aria-label="Wishlist"
              >
                <Heart className="h-5 w-5" />
                {wishlistCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#B76E79] text-[10px] font-bold text-white">
                    {wishlistCount}
                  </span>
                )}
              </Link>

              {/* Cart */}
              <Link
                href="/cart"
                className="relative p-2 text-gray-600 hover:text-[#722F37] transition-colors"
                aria-label="Cart"
              >
                <ShoppingBag className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#D4AF37] text-[10px] font-bold text-white">
                    {itemCount > 9 ? '9+' : itemCount}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Navigation Bar (desktop) */}
        <nav className="hidden bg-white border-b border-gray-100 lg:block">
          <div className="container-wide">
            <ul className="flex items-center justify-center gap-1">
              {navLinks.map((link) => (
                <li
                  key={link.label}
                  className="relative"
                  onMouseEnter={() => link.megaMenu && handleMenuEnter(link.label)}
                  onMouseLeave={handleMenuLeave}
                >
                  <Link
                    href={link.href}
                    className={cn(
                      'flex items-center gap-1 px-4 py-3 text-sm font-medium text-gray-700 transition-colors hover:text-[#722F37]',
                      activeMenu === link.label && 'text-[#722F37]'
                    )}
                  >
                    {link.label}
                    {link.megaMenu && (
                      <ChevronDown
                        className={cn(
                          'h-3.5 w-3.5 transition-transform duration-200',
                          activeMenu === link.label && 'rotate-180'
                        )}
                      />
                    )}
                  </Link>

                  {/* Mega Menu */}
                  {link.megaMenu && activeMenu === link.label && (
                    <div className="absolute left-1/2 top-full z-50 -translate-x-1/2 pt-0">
                      <div className="min-w-[240px] rounded-xl border border-gray-100 bg-white p-4 shadow-xl">
                        <ul className="space-y-0.5">
                          {link.megaMenu.map((item) => (
                            <li key={item.name}>
                              <Link
                                href={item.href}
                                className="block rounded-lg px-3 py-2 text-sm text-gray-700 transition-colors hover:bg-[#FDF2F4] hover:text-[#722F37]"
                              >
                                {item.name}
                              </Link>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
