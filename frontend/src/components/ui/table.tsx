import React from 'react';
import { cn } from '@/lib/utils';

/* ---------- Table wrapper (adds horizontal scroll) ---------- */
function Table({ className, ...props }: React.HTMLAttributes<HTMLTableElement>) {
  return (
    <div className="w-full overflow-x-auto rounded-xl border border-gray-200">
      <table
        className={cn('w-full caption-bottom text-sm', className)}
        {...props}
      />
    </div>
  );
}

/* ---------- Table Header ---------- */
function TableHeader({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <thead
      className={cn('bg-gray-50 text-left text-xs font-semibold uppercase tracking-wider text-gray-500', className)}
      {...props}
    />
  );
}

/* ---------- Table Body ---------- */
function TableBody({ className, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) {
  return (
    <tbody
      className={cn('divide-y divide-gray-100', className)}
      {...props}
    />
  );
}

/* ---------- Table Row ---------- */
function TableRow({ className, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return (
    <tr
      className={cn(
        'transition-colors hover:bg-gray-50/60',
        className
      )}
      {...props}
    />
  );
}

/* ---------- Table Head Cell ---------- */
function TableHead({ className, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) {
  return (
    <th
      className={cn('px-4 py-3 font-semibold', className)}
      {...props}
    />
  );
}

/* ---------- Table Data Cell ---------- */
function TableCell({ className, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) {
  return (
    <td
      className={cn('px-4 py-3 text-gray-700', className)}
      {...props}
    />
  );
}

export { Table, TableHeader, TableBody, TableRow, TableHead, TableCell };
