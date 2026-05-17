'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Ticket, Power } from 'lucide-react';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface Coupon {
  id: string;
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderAmount: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

interface CouponFormData {
  code: string;
  type: 'PERCENTAGE' | 'FLAT';
  value: number;
  minOrderAmount: number;
  maxDiscount: string;
  usageLimit: string;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
}

const emptyForm: CouponFormData = {
  code: '',
  type: 'PERCENTAGE',
  value: 0,
  minOrderAmount: 0,
  maxDiscount: '',
  usageLimit: '',
  validFrom: '',
  validUntil: '',
  isActive: true,
};

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  const [form, setForm] = useState<CouponFormData>(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const fetchCoupons = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getCoupons();
      setCoupons(res.data.data || []);
    } catch (err) {
      console.error('Failed to load coupons:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openAdd = () => {
    setEditingCoupon(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      minOrderAmount: coupon.minOrderAmount,
      maxDiscount: coupon.maxDiscount?.toString() || '',
      usageLimit: coupon.usageLimit?.toString() || '',
      validFrom: coupon.validFrom ? coupon.validFrom.split('T')[0] : '',
      validUntil: coupon.validUntil ? coupon.validUntil.split('T')[0] : '',
      isActive: coupon.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (coupon: Coupon) => {
    if (!window.confirm(`Delete coupon "${coupon.code}"?`)) return;
    try {
      await adminAPI.deleteCoupon(coupon.id);
      toast.success('Coupon deleted');
      fetchCoupons();
    } catch {
      toast.error('Failed to delete coupon');
    }
  };

  const handleToggleActive = async (coupon: Coupon) => {
    try {
      await adminAPI.updateCoupon(coupon.id, { isActive: !coupon.isActive });
      toast.success(coupon.isActive ? 'Coupon deactivated' : 'Coupon activated');
      fetchCoupons();
    } catch {
      toast.error('Failed to update coupon');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.code.trim()) {
      toast.error('Coupon code is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        code: form.code.toUpperCase(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: Number(form.minOrderAmount),
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : undefined,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        validFrom: form.validFrom || undefined,
        validUntil: form.validUntil || undefined,
        isActive: form.isActive,
      };

      if (editingCoupon) {
        await adminAPI.updateCoupon(editingCoupon.id, payload);
        toast.success('Coupon updated');
      } else {
        await adminAPI.createCoupon(payload);
        toast.success('Coupon created');
      }
      setDialogOpen(false);
      fetchCoupons();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save coupon');
    } finally {
      setSubmitting(false);
    }
  };

  const isExpired = (coupon: Coupon) => {
    if (!coupon.validUntil) return false;
    return new Date(coupon.validUntil) < new Date();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Ticket className="h-6 w-6 text-[#722F37]" />
          <h1 className="text-2xl font-bold text-gray-900">Coupons</h1>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Coupon
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Code</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Min Order</TableHead>
              <TableHead>Usage</TableHead>
              <TableHead>Valid Until</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {coupons.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="py-12 text-center text-gray-400">
                  No coupons found
                </TableCell>
              </TableRow>
            ) : (
              coupons.map((coupon) => (
                <TableRow key={coupon.id}>
                  <TableCell>
                    <span className="rounded bg-gray-100 px-2 py-1 font-mono text-sm font-bold text-gray-900">
                      {coupon.code}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge variant="info">
                      {coupon.type === 'PERCENTAGE' ? 'Percentage' : 'Flat'}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {coupon.type === 'PERCENTAGE'
                      ? `${coupon.value}%`
                      : formatCurrency(coupon.value)}
                    {coupon.maxDiscount && (
                      <span className="ml-1 text-xs text-gray-400">
                        (max {formatCurrency(coupon.maxDiscount)})
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-gray-600">
                    {coupon.minOrderAmount > 0 ? formatCurrency(coupon.minOrderAmount) : '-'}
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">
                      {coupon.usedCount}
                      {coupon.usageLimit && ` / ${coupon.usageLimit}`}
                    </span>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {coupon.validUntil
                      ? new Date(coupon.validUntil).toLocaleDateString('en-IN')
                      : 'No expiry'}
                  </TableCell>
                  <TableCell>
                    {isExpired(coupon) ? (
                      <Badge variant="danger">Expired</Badge>
                    ) : (
                      <Badge variant={coupon.isActive ? 'success' : 'warning'}>
                        {coupon.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(coupon)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleActive(coupon)}
                        title={coupon.isActive ? 'Deactivate' : 'Activate'}
                      >
                        <Power className={`h-4 w-4 ${coupon.isActive ? 'text-green-500' : 'text-gray-400'}`} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(coupon)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}

      {/* Add/Edit Coupon Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingCoupon ? 'Edit Coupon' : 'Add Coupon'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Coupon Code"
            value={form.code}
            onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
            placeholder="e.g. SAVE10"
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              label="Type"
              options={[
                { value: 'PERCENTAGE', label: 'Percentage' },
                { value: 'FLAT', label: 'Flat Amount' },
              ]}
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value as 'PERCENTAGE' | 'FLAT' })}
            />
            <Input
              label={form.type === 'PERCENTAGE' ? 'Discount %' : 'Discount Amount'}
              type="number"
              step="0.01"
              value={form.value}
              onChange={(e) => setForm({ ...form, value: Number(e.target.value) })}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Min Order Amount"
              type="number"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(e) => setForm({ ...form, minOrderAmount: Number(e.target.value) })}
            />
            {form.type === 'PERCENTAGE' && (
              <Input
                label="Max Discount (optional)"
                type="number"
                step="0.01"
                value={form.maxDiscount}
                onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                placeholder="No cap"
              />
            )}
          </div>
          <Input
            label="Usage Limit (optional)"
            type="number"
            value={form.usageLimit}
            onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
            placeholder="Unlimited"
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Valid From"
              type="date"
              value={form.validFrom}
              onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
            />
            <Input
              label="Valid Until"
              type="date"
              value={form.validUntil}
              onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
            />
          </div>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
            />
            Active
          </label>
          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={submitting}>
              {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
