'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  FolderTree,
  IndianRupee,
  Gem,
  Hammer,
  ShoppingBag,
  Users,
  Ticket,
  Settings,
  LogOut,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuthStore } from '@/stores/authStore';

const navItems = [
  { label: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { label: 'Products', href: '/admin/products', icon: Package },
  { label: 'Categories', href: '/admin/categories', icon: FolderTree },
  { label: 'Orders', href: '/admin/orders', icon: ShoppingCart },
  {
    label: 'Pricing',
    icon: IndianRupee,
    children: [
      { label: 'Silver Rate', href: '/admin/pricing/silver-rate', icon: IndianRupee },
      { label: 'Gemstone Master', href: '/admin/pricing/gemstone-master', icon: Gem },
      { label: 'Making Charges', href: '/admin/pricing/making-charges', icon: Hammer },
    ],
  },
  { label: 'Abandoned Carts', href: '/admin/abandoned-carts', icon: ShoppingBag },
  { label: 'Customers', href: '/admin/customers', icon: Users },
  { label: 'Coupons', href: '/admin/coupons', icon: Ticket },
  { label: 'Settings', href: '/admin/settings', icon: Settings },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const logout = useAuthStore((s) => s.logout);

  const isActive = (href: string) => {
    if (href === '/admin') return pathname === '/admin';
    return pathname.startsWith(href);
  };

  return (
    <aside className="flex h-screen w-64 shrink-0 flex-col border-r border-gray-200 bg-white">
      {/* Logo */}
      <div className="flex h-16 items-center gap-2.5 border-b border-gray-200 px-6">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#722F37]">
          <Gem className="h-4 w-4 text-white" />
        </div>
        <span className="text-lg font-bold text-gray-900">JewelUp</span>
        <span className="ml-auto rounded bg-[#722F37]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[#722F37]">
          Admin
        </span>
      </div>

      {/* Nav */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          if (item.children) {
            const isGroupActive = item.children.some((c) => isActive(c.href));
            return (
              <div key={item.label} className="space-y-1">
                <p
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2 text-xs font-semibold uppercase tracking-wider',
                    isGroupActive ? 'text-[#722F37]' : 'text-gray-400'
                  )}
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </p>
                {item.children.map((child) => (
                  <Link
                    key={child.href}
                    href={child.href}
                    className={cn(
                      'flex items-center gap-3 rounded-lg px-3 py-2 pl-10 text-sm font-medium transition-colors',
                      isActive(child.href)
                        ? 'bg-[#722F37]/10 text-[#722F37]'
                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    )}
                  >
                    <child.icon className="h-4 w-4" />
                    {child.label}
                  </Link>
                ))}
              </div>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href!}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href!)
                  ? 'bg-[#722F37]/10 text-[#722F37]'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => logout()}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition-colors hover:bg-red-50 hover:text-red-600"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}
