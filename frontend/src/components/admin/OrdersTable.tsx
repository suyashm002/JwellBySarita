'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Eye } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { Order, OrderStatus } from '@/types/order';

export interface OrdersPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface OrdersTableProps {
  orders: Order[];
  pagination?: OrdersPagination;
  onPageChange?: (page: number) => void;
}

const statusBadgeVariant: Record<OrderStatus, 'default' | 'success' | 'warning' | 'danger' | 'info'> = {
  PENDING: 'warning',
  CONFIRMED: 'info',
  PACKED: 'info',
  QUALITY_CHECKED: 'info',
  DISPATCHED: 'default',
  OUT_FOR_DELIVERY: 'default',
  DELIVERED: 'success',
  CANCELLED: 'danger',
  RETURNED: 'danger',
};

const statusLabel: Record<OrderStatus, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  PACKED: 'Packed',
  QUALITY_CHECKED: 'QC Passed',
  DISPATCHED: 'Dispatched',
  OUT_FOR_DELIVERY: 'Out for Delivery',
  DELIVERED: 'Delivered',
  CANCELLED: 'Cancelled',
  RETURNED: 'Returned',
};

type SortKey = 'orderNumber' | 'createdAt' | 'grandTotal' | 'status';

export function OrdersTable({ orders, pagination, onPageChange }: OrdersTableProps) {
  const router = useRouter();
  const [sortKey, setSortKey] = useState<SortKey>('createdAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...orders].sort((a, b) => {
    let cmp = 0;
    switch (sortKey) {
      case 'orderNumber':
        cmp = a.orderNumber.localeCompare(b.orderNumber);
        break;
      case 'createdAt':
        cmp = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        break;
      case 'grandTotal':
        cmp = a.grandTotal - b.grandTotal;
        break;
      case 'status':
        cmp = a.status.localeCompare(b.status);
        break;
    }
    return sortDir === 'asc' ? cmp : -cmp;
  });

  const SortIcon = ({ column }: { column: SortKey }) => {
    if (sortKey !== column) return <ChevronUp className="h-3 w-3 text-gray-300" />;
    return sortDir === 'asc' ? (
      <ChevronUp className="h-3 w-3 text-[#722F37]" />
    ) : (
      <ChevronDown className="h-3 w-3 text-[#722F37]" />
    );
  };

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('orderNumber')}
            >
              <span className="inline-flex items-center gap-1">
                Order # <SortIcon column="orderNumber" />
              </span>
            </TableHead>
            <TableHead>Customer</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('createdAt')}
            >
              <span className="inline-flex items-center gap-1">
                Date <SortIcon column="createdAt" />
              </span>
            </TableHead>
            <TableHead>Items</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('grandTotal')}
            >
              <span className="inline-flex items-center gap-1">
                Total <SortIcon column="grandTotal" />
              </span>
            </TableHead>
            <TableHead>Payment</TableHead>
            <TableHead
              className="cursor-pointer select-none"
              onClick={() => handleSort('status')}
            >
              <span className="inline-flex items-center gap-1">
                Status <SortIcon column="status" />
              </span>
            </TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sorted.length === 0 ? (
            <TableRow>
              <TableCell colSpan={8} className="py-12 text-center text-gray-400">
                No orders found
              </TableCell>
            </TableRow>
          ) : (
            sorted.map((order) => (
              <TableRow
                key={order.id}
                className="cursor-pointer"
                onClick={() => router.push(`/admin/orders/${order.id}`)}
              >
                <TableCell className="font-medium text-gray-900">
                  {order.orderNumber}
                </TableCell>
                <TableCell>
                  {order.addressSnapshot?.name || 'N/A'}
                </TableCell>
                <TableCell className="text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
                <TableCell>{order.items?.length || 0}</TableCell>
                <TableCell className="font-medium">
                  {formatCurrency(order.grandTotal)}
                </TableCell>
                <TableCell>
                  <Badge variant={order.paymentStatus === 'PAID' ? 'success' : order.paymentStatus === 'FAILED' ? 'danger' : 'warning'}>
                    {order.paymentStatus}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant={statusBadgeVariant[order.status]}>
                    {statusLabel[order.status]}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/admin/orders/${order.id}`);
                    }}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {pagination && pagination.totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            Showing {(pagination.page - 1) * pagination.limit + 1} to{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} of{' '}
            {pagination.total} orders
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page <= 1}
              onClick={() => onPageChange?.(pagination.page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
              .filter(
                (p) =>
                  p === 1 ||
                  p === pagination.totalPages ||
                  Math.abs(p - pagination.page) <= 1
              )
              .map((p, idx, arr) => (
                <React.Fragment key={p}>
                  {idx > 0 && arr[idx - 1] !== p - 1 && (
                    <span className="px-1 text-gray-400">...</span>
                  )}
                  <Button
                    variant={p === pagination.page ? 'primary' : 'secondary'}
                    size="sm"
                    onClick={() => onPageChange?.(p)}
                  >
                    {p}
                  </Button>
                </React.Fragment>
              ))}
            <Button
              variant="secondary"
              size="sm"
              disabled={pagination.page >= pagination.totalPages}
              onClick={() => onPageChange?.(pagination.page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
