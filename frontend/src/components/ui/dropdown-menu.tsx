'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';

/* ---------- Root context ---------- */
interface DropdownContextValue {
  open: boolean;
  toggle: () => void;
  close: () => void;
}

const DropdownContext = React.createContext<DropdownContextValue | null>(null);

function useDropdown() {
  const ctx = React.useContext(DropdownContext);
  if (!ctx) throw new Error('Dropdown compound components must be used within <DropdownMenu>');
  return ctx;
}

/* ---------- DropdownMenu (root) ---------- */
export interface DropdownMenuProps {
  children: React.ReactNode;
  className?: string;
}

function DropdownMenu({ children, className }: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const toggle = useCallback(() => setOpen((prev) => !prev), []);
  const close = useCallback(() => setOpen(false), []);

  // Close on outside click
  useEffect(() => {
    if (!open) return;

    function handleClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }

    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, toggle, close }}>
      <div ref={containerRef} className={cn('relative inline-block', className)}>
        {children}
      </div>
    </DropdownContext.Provider>
  );
}

/* ---------- Trigger ---------- */
export interface DropdownTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

function DropdownTrigger({ className, children, ...props }: DropdownTriggerProps) {
  const { toggle } = useDropdown();

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn('inline-flex items-center', className)}
      aria-haspopup="true"
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Content ---------- */
export interface DropdownContentProps extends React.HTMLAttributes<HTMLDivElement> {
  align?: 'left' | 'right';
}

function DropdownContent({ className, align = 'left', children, ...props }: DropdownContentProps) {
  const { open } = useDropdown();

  if (!open) return null;

  return (
    <div
      role="menu"
      className={cn(
        'absolute z-50 mt-2 min-w-[180px] rounded-lg border border-gray-200 bg-white py-1 shadow-lg',
        'animate-in fade-in-0 zoom-in-95',
        align === 'right' && 'right-0',
        align === 'left' && 'left-0',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

/* ---------- Item ---------- */
export interface DropdownItemProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  destructive?: boolean;
}

function DropdownItem({ className, destructive, children, onClick, ...props }: DropdownItemProps) {
  const { close } = useDropdown();

  return (
    <button
      type="button"
      role="menuitem"
      className={cn(
        'flex w-full items-center gap-2 px-4 py-2 text-left text-sm transition-colors',
        destructive
          ? 'text-red-600 hover:bg-red-50'
          : 'text-gray-700 hover:bg-gray-50',
        className
      )}
      onClick={(e) => {
        onClick?.(e);
        close();
      }}
      {...props}
    >
      {children}
    </button>
  );
}

/* ---------- Separator ---------- */
function DropdownSeparator({ className }: { className?: string }) {
  return <div className={cn('my-1 h-px bg-gray-200', className)} role="separator" />;
}

export {
  DropdownMenu,
  DropdownTrigger,
  DropdownContent,
  DropdownItem,
  DropdownSeparator,
};
