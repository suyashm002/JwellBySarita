'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  MapPin,
  Plus,
  Pencil,
  Trash2,
  ChevronLeft,
  Star,
  Phone,
  User,
} from 'lucide-react';
import toast from 'react-hot-toast';

import { useRequireAuth } from '@/hooks/useAuth';
import { userAPI } from '@/lib/api';
import type { Address } from '@/types/user';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardBody } from '@/components/ui/card';
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

/* ------------------------------------------------------------------ */
/*  Schema                                                            */
/* ------------------------------------------------------------------ */

const addressSchema = z.object({
  label: z.string().min(1, 'Label is required (e.g. Home, Office)'),
  name: z.string().min(2, 'Name is required'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit phone number'),
  line1: z.string().min(5, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(2, 'City is required'),
  state: z.string().min(2, 'State is required'),
  pincode: z.string().regex(/^\d{6}$/, 'Enter a valid 6-digit pincode'),
  isDefault: z.boolean().optional(),
});

type AddressFormData = z.infer<typeof addressSchema>;

/* ------------------------------------------------------------------ */
/*  Page                                                              */
/* ------------------------------------------------------------------ */

export default function AddressesPage() {
  useRequireAuth();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  /* ---- Fetch ---- */
  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const { data: res } = await userAPI.getAddresses();
      setAddresses(res.data ?? []);
    } catch {
      toast.error('Failed to load addresses');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAddresses();
  }, [fetchAddresses]);

  /* ---- Open add / edit ---- */
  const openAdd = () => {
    setEditingId(null);
    reset({
      label: '',
      name: '',
      phone: '',
      line1: '',
      line2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });
    setDialogOpen(true);
  };

  const openEdit = (addr: Address) => {
    setEditingId(addr.id);
    reset({
      label: addr.label,
      name: addr.name,
      phone: addr.phone,
      line1: addr.line1,
      line2: addr.line2 ?? '',
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      isDefault: addr.isDefault,
    });
    setDialogOpen(true);
  };

  /* ---- Save ---- */
  const onSave = async (data: AddressFormData) => {
    try {
      if (editingId) {
        await userAPI.updateAddress(editingId, data);
        toast.success('Address updated');
      } else {
        await userAPI.addAddress(data);
        toast.success('Address added');
      }
      setDialogOpen(false);
      fetchAddresses();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save address');
    }
  };

  /* ---- Delete ---- */
  const handleDelete = async (id: string) => {
    if (!confirm('Delete this address?')) return;
    try {
      setDeleting(id);
      await userAPI.deleteAddress(id);
      toast.success('Address deleted');
      setAddresses((prev) => prev.filter((a) => a.id !== id));
    } catch {
      toast.error('Failed to delete address');
    } finally {
      setDeleting(null);
    }
  };

  /* ------------------------------------------------------------------ */
  /*  Render                                                            */
  /* ------------------------------------------------------------------ */

  return (
    <div className="mx-auto max-w-3xl space-y-6 px-4 py-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/account"
            className="mb-2 inline-flex items-center gap-1 text-xs text-gray-400 hover:text-[#722F37]"
          >
            <ChevronLeft className="h-3 w-3" />
            My Account
          </Link>
          <h1 className="font-[family-name:var(--font-playfair)] text-2xl font-bold text-gray-900">
            My Addresses
          </h1>
        </div>
        <Button size="sm" onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Address
        </Button>
      </div>

      {/* Loading */}
      {loading && (
        <div className="grid gap-4 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="card" className="h-44" />
          ))}
        </div>
      )}

      {/* Empty */}
      {!loading && addresses.length === 0 && (
        <Card>
          <CardBody className="flex flex-col items-center gap-4 py-16 text-center">
            <span className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
              <MapPin className="h-8 w-8 text-gray-400" />
            </span>
            <h2 className="text-lg font-semibold text-gray-900">No addresses saved</h2>
            <p className="text-sm text-gray-500">
              Add a delivery address to speed up checkout.
            </p>
            <Button onClick={openAdd}>
              <Plus className="h-4 w-4" />
              Add Address
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Address grid */}
      {!loading && addresses.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {addresses.map((addr) => (
            <Card
              key={addr.id}
              className={`relative transition-all ${
                addr.isDefault
                  ? 'border-[#B76E79] ring-1 ring-[#B76E79]/20'
                  : 'border-gray-200'
              }`}
            >
              <CardBody className="space-y-3">
                {/* Label + default badge */}
                <div className="flex items-center gap-2">
                  <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-[#B76E79]/10">
                    <MapPin className="h-3.5 w-3.5 text-[#722F37]" />
                  </span>
                  <span className="text-sm font-semibold text-gray-900">
                    {addr.label}
                  </span>
                  {addr.isDefault && (
                    <Badge variant="success" className="ml-auto">
                      <Star className="mr-1 h-3 w-3" />
                      Default
                    </Badge>
                  )}
                </div>

                {/* Name */}
                <p className="flex items-center gap-1.5 text-sm text-gray-800">
                  <User className="h-3.5 w-3.5 text-gray-400" />
                  {addr.name}
                </p>

                {/* Address text */}
                <p className="text-sm leading-relaxed text-gray-600">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ''}
                  <br />
                  {addr.city}, {addr.state} &mdash; {addr.pincode}
                </p>

                {/* Phone */}
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Phone className="h-3 w-3" />
                  +91 {addr.phone}
                </p>

                {/* Actions */}
                <div className="flex items-center gap-2 border-t border-gray-100 pt-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openEdit(addr)}
                  >
                    <Pencil className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    loading={deleting === addr.id}
                    onClick={() => handleDelete(addr.id)}
                    className="text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Delete
                  </Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}

      {/* ---- Address Form Dialog ---- */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingId ? 'Edit Address' : 'Add New Address'}
        className="max-w-xl"
      >
        <form onSubmit={handleSubmit(onSave)} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              label="Label"
              placeholder="e.g. Home, Office"
              error={errors.label?.message}
              {...register('label')}
            />
            <Input
              label="Full Name"
              placeholder="Recipient name"
              error={errors.name?.message}
              {...register('name')}
            />
          </div>

          <Input
            label="Phone Number"
            type="tel"
            placeholder="9876543210"
            icon={<Phone className="h-4 w-4" />}
            error={errors.phone?.message}
            {...register('phone')}
          />

          <Input
            label="Address Line 1"
            placeholder="House no., Street, Area"
            error={errors.line1?.message}
            {...register('line1')}
          />

          <Input
            label="Address Line 2 (optional)"
            placeholder="Landmark, etc."
            error={errors.line2?.message}
            {...register('line2')}
          />

          <div className="grid gap-4 sm:grid-cols-3">
            <Input
              label="City"
              placeholder="City"
              error={errors.city?.message}
              {...register('city')}
            />
            <Input
              label="State"
              placeholder="State"
              error={errors.state?.message}
              {...register('state')}
            />
            <Input
              label="Pincode"
              placeholder="6-digit"
              error={errors.pincode?.message}
              {...register('pincode')}
            />
          </div>

          {/* Default checkbox */}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
              {...register('isDefault')}
            />
            <span className="text-sm text-gray-700">Set as default address</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" loading={isSubmitting}>
              {editingId ? 'Update Address' : 'Save Address'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
