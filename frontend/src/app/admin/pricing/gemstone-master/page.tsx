'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Gem, Upload } from 'lucide-react';
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
import { Dialog } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { PricingMasterForm, GemstoneFormValues } from '@/components/admin/PricingMasterForm';
import { pricingAPI, adminAPI } from '@/lib/api';
import { GemstoneRate } from '@/types/product';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

export default function GemstoneMasterPage() {
  const [rates, setRates] = useState<GemstoneRate[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRate, setEditingRate] = useState<GemstoneRate | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRates = useCallback(async () => {
    try {
      setLoading(true);
      const res = await pricingAPI.getGemstoneRates();
      setRates(res.data.data || []);
    } catch (err) {
      console.error('Failed to load gemstone rates:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRates();
  }, [fetchRates]);

  const openAdd = () => {
    setEditingRate(null);
    setDialogOpen(true);
  };

  const openEdit = (rate: GemstoneRate) => {
    setEditingRate(rate);
    setDialogOpen(true);
  };

  const handleDelete = async (rate: GemstoneRate) => {
    if (!window.confirm(`Delete "${rate.name}" rate?`)) return;
    try {
      await adminAPI.deleteGemstoneRate(rate.id);
      toast.success('Rate deleted');
      fetchRates();
    } catch {
      toast.error('Failed to delete rate');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      if (editingRate) {
        await adminAPI.updateGemstoneRate(editingRate.id, data);
        toast.success('Rate updated');
      } else {
        await adminAPI.createGemstoneRate(data);
        toast.success('Rate created');
      }
      setDialogOpen(false);
      fetchRates();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save rate');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Gem className="h-6 w-6 text-[#722F37]" />
          <h1 className="text-2xl font-bold text-gray-900">Gemstone Rate Master</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="secondary" disabled>
            <Upload className="h-4 w-4" />
            Bulk Upload CSV
          </Button>
          <Button onClick={openAdd}>
            <Plus className="h-4 w-4" />
            Add Rate
          </Button>
        </div>
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
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Quality Grade</TableHead>
              <TableHead>Rate / Carat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Effective From</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="py-12 text-center text-gray-400">
                  No gemstone rates configured
                </TableCell>
              </TableRow>
            ) : (
              rates.map((rate) => (
                <TableRow key={rate.id}>
                  <TableCell className="font-medium text-gray-900">{rate.name}</TableCell>
                  <TableCell className="text-gray-600">{rate.type}</TableCell>
                  <TableCell>
                    <Badge variant="default">{rate.qualityGrade}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {formatCurrency(rate.ratePerCarat)}
                  </TableCell>
                  <TableCell>
                    <Badge variant={rate.isActive ? 'success' : 'danger'}>
                      {rate.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-gray-500">
                    {new Date(rate.effectiveFrom).toLocaleDateString('en-IN')}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(rate)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rate)}
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

      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingRate ? 'Edit Gemstone Rate' : 'Add Gemstone Rate'}
      >
        <PricingMasterForm
          type="gemstone"
          defaultValues={
            editingRate
              ? {
                  name: editingRate.name,
                  type: editingRate.type,
                  qualityGrade: editingRate.qualityGrade,
                  ratePerCarat: editingRate.ratePerCarat,
                }
              : undefined
          }
          onSubmit={handleSubmit}
          onCancel={() => setDialogOpen(false)}
          loading={submitting}
        />
      </Dialog>
    </div>
  );
}
