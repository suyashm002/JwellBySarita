'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingCart,
  IndianRupee,
  ChevronDown,
  ShoppingBag,
  Ticket,
  Users,
  Settings,
  Gem,
  Percent,
  TrendingUp,
  Megaphone,
  BarChart3,
  X,
  Menu,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  href?: string;
  icon: React.ElementType;
  children?: { label: string; href: string; icon: React.ElementType }[];
}

const navItems: NavItem[] = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  {
    label: 'Pricing',
    icon: IndianRupee,
    children: [
      { label: 'Silver Rate', href: '/admin/pricing/silver-rate', icon: TrendingUp },
      { label: 'Gemstone Master', href: '/admin/pricing/gemstones', icon: Gem },
      { label: 'Making Charges', href: '/admin/pricing/making-charges', icon: Percent },
    ],
  },
  { label: 'Abandoned Carts', href: '/admin/abandoned-carts', icon: ShoppingBag },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  {
    label: 'Meta Ads',
    icon: Megaphone,
    children: [
      { label: 'Campaigns', href: '/admin/meta-ads', icon: Megaphone },
      { label: 'Insights', href: '/admin/meta-ads/insights', icon: BarChart3 },
    ],
  },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [openSubmenu, setOpenSubmenu] = useState<string | null>(() => {
    // Auto-open submenu if on a matching page
    if (pathname.startsWith('/admin/pricing')) return 'Pricing';
    if (pathname.startsWith('/admin/meta-ads')) return 'Meta Ads';
    return null;
  });

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  const toggleSubmenu = (label: string) => {
    setOpenSubmenu((prev) => (prev === label ? null : label));
  };

  const sidebarContent = (
    <div className="flex h-full flex-col">
      {/* Logo */}
      <div className="flex items-center justify-between border-b border-gray-100 px-5 py-4">
        <Link href="/admin" className="flex-shrink-0">
          <h2
            className={cn(
              'font-heading font-bold text-[#722F37] transition-all',
              collapsed ? 'text-base' : 'text-lg'
            )}
          >
            {collapsed ? 'J' : 'Jewelup'}
            {!collapsed && (
              <span className="font-normal text-[#B76E79]"> Admin</span>
            )}
          </h2>
        </Link>
        <button
          onClick={() => setMobileOpen(false)}
          className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 lg:hidden"
          aria-label="Close sidebar"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => (
            <li key={item.label}>
              {item.children ? (
                <div>
                  <button
                    onClick={() => toggleSubmenu(item.label)}
                    className={cn(
                      'flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50',
                      openSubmenu === item.label && 'bg-gray-50'
                    )}
                  >
                    <span className="flex items-center gap-3">
                      <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                      {!collapsed && item.label}
                    </span>
                    {!collapsed && (
                      <ChevronDown
                        className={cn(
                          'h-4 w-4 text-gray-400 transition-transform duration-200',
                          openSubmenu === item.label && 'rotate-180'
                        )}
                      />
                    )}
                  </button>
                  {!collapsed && openSubmenu === item.label && (
                    <ul className="mt-1 space-y-0.5 pl-4">
                      {item.children.map((child) => (
                        <li key={child.label}>
                          <Link
                            href={child.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                              'flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors',
                              isActive(child.href)
                                ? 'bg-[#722F37]/10 font-semibold text-[#722F37]'
                                : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                            )}
                          >
                            <child.icon className="h-4 w-4 flex-shrink-0" />
                            {child.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ) : (
                <Link
                  href={item.href!}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                    isActive(item.href!)
                      ? 'bg-[#722F37] text-white shadow-sm'
                      : 'text-gray-700 hover:bg-gray-50'
                  )}
                >
                  <item.icon className="h-4.5 w-4.5 flex-shrink-0" />
                  {!collapsed && item.label}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </nav>

      {/* Collapse Toggle (desktop) */}
      <div className="hidden border-t border-gray-100 p-3 lg:block">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center rounded-lg py-2 text-sm text-gray-500 hover:bg-gray-50 transition-colors"
        >
          {collapsed ? '>>' : '<< Collapse'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        onClick={() => setMobileOpen(true)}
        className="fixed left-4 top-4 z-40 rounded-lg bg-white p-2 shadow-md lg:hidden"
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5 text-gray-700" />
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-0 z-50 h-full w-64 bg-white shadow-xl transition-transform duration-300 lg:hidden',
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {sidebarContent}
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={cn(
          'hidden h-screen border-r border-gray-100 bg-white transition-all duration-300 lg:block',
          collapsed ? 'w-[72px]' : 'w-64'
        )}
      >
        {sidebarContent}
      </aside>
    </>
  );
}
