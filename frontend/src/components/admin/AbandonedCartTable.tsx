'use client';

import React from 'react';
import { Mail, MessageSquare, Phone } from 'lucide-react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency, timeAgo } from '@/lib/utils';

export interface AbandonedCart {
  id: string;
  customerName: string;
  email?: string;
  phone?: string;
  cartValue: number;
  itemCount: number;
  abandonedAt: string;
  recoveryStage: string;
  recovered: boolean;
}

export interface AbandonedCartTableProps {
  carts: AbandonedCart[];
  onSendOutreach?: (cartId: string, channel: string) => void;
}

const stageBadgeVariant: Record<string, 'default' | 'info' | 'warning' | 'success' | 'danger'> = {
  DETECTED: 'warning',
  EMAIL_SENT_1: 'info',
  EMAIL_SENT_2: 'info',
  SMS_SENT: 'default',
  WHATSAPP_SENT: 'default',
  RECOVERED: 'success',
  EXPIRED: 'danger',
};

const stageLabel: Record<string, string> = {
  DETECTED: 'Detected',
  EMAIL_SENT_1: 'Email #1 Sent',
  EMAIL_SENT_2: 'Email #2 Sent',
  SMS_SENT: 'SMS Sent',
  WHATSAPP_SENT: 'WhatsApp Sent',
  RECOVERED: 'Recovered',
  EXPIRED: 'Expired',
};

export function AbandonedCartTable({ carts, onSendOutreach }: AbandonedCartTableProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Customer</TableHead>
          <TableHead>Email / Phone</TableHead>
          <TableHead>Cart Value</TableHead>
          <TableHead>Time Abandoned</TableHead>
          <TableHead>Recovery Stage</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {carts.length === 0 ? (
          <TableRow>
            <TableCell colSpan={6} className="py-12 text-center text-gray-400">
              No abandoned carts found
            </TableCell>
          </TableRow>
        ) : (
          carts.map((cart) => (
            <TableRow key={cart.id}>
              <TableCell className="font-medium text-gray-900">
                {cart.customerName}
              </TableCell>
              <TableCell>
                <div className="space-y-0.5 text-sm">
                  {cart.email && <p className="text-gray-600">{cart.email}</p>}
                  {cart.phone && <p className="text-gray-400">{cart.phone}</p>}
                </div>
              </TableCell>
              <TableCell className="font-medium">
                {formatCurrency(cart.cartValue)}
                <span className="ml-1 text-xs text-gray-400">
                  ({cart.itemCount} items)
                </span>
              </TableCell>
              <TableCell className="text-gray-500">
                {timeAgo(cart.abandonedAt)}
              </TableCell>
              <TableCell>
                <Badge variant={stageBadgeVariant[cart.recoveryStage] || 'default'}>
                  {stageLabel[cart.recoveryStage] || cart.recoveryStage}
                </Badge>
              </TableCell>
              <TableCell>
                {!cart.recovered && cart.recoveryStage !== 'EXPIRED' && (
                  <div className="flex items-center gap-1">
                    {cart.email && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSendOutreach?.(cart.id, 'email')}
                        title="Send Email"
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    {cart.phone && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSendOutreach?.(cart.id, 'sms')}
                          title="Send SMS"
                        >
                          <Phone className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onSendOutreach?.(cart.id, 'whatsapp')}
                          title="Send WhatsApp"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </TableCell>
            </TableRow>
          ))
        )}
      </TableBody>
    </Table>
  );
}
