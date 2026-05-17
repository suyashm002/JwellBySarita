'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { Plus, Edit, Trash2, Hammer } from 'lucide-react';
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
import { PricingMasterForm, MakingChargeFormValues } from '@/components/admin/PricingMasterForm';
import { adminAPI } from '@/lib/api';
import { formatCurrency } from '@/lib/utils';
import toast from 'react-hot-toast';

interface MakingChargeRule {
  id: string;
  name: string;
  type: 'FLAT' | 'PERCENTAGE' | 'PER_GRAM';
  value: number;
  scope: string;
  scopeId?: string;
  isActive: boolean;
}

const typeLabels: Record<string, string> = {
  FLAT: 'Flat Amount',
  PERCENTAGE: 'Percentage',
  PER_GRAM: 'Per Gram',
};

const scopeLabels: Record<string, string> = {
  GLOBAL: 'Global',
  CATEGORY: 'Category',
  PRODUCT: 'Product',
};

export default function MakingChargesPage() {
  const [rules, setRules] = useState<MakingChargeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<MakingChargeRule | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      const res = await adminAPI.getMakingCharges();
      setRules(res.data.data || []);
    } catch (err) {
      console.error('Failed to load making charges:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRules();
  }, [fetchRules]);

  const openAdd = () => {
    setEditingRule(null);
    setDialogOpen(true);
  };

  const openEdit = (rule: MakingChargeRule) => {
    setEditingRule(rule);
    setDialogOpen(true);
  };

  const handleDelete = async (rule: MakingChargeRule) => {
    if (!window.confirm(`Delete "${rule.name}"?`)) return;
    try {
      await adminAPI.deleteMakingCharge(rule.id);
      toast.success('Rule deleted');
      fetchRules();
    } catch {
      toast.error('Failed to delete rule');
    }
  };

  const handleSubmit = async (data: any) => {
    try {
      setSubmitting(true);
      if (editingRule) {
        await adminAPI.updateMakingCharge(editingRule.id, data);
        toast.success('Rule updated');
      } else {
        await adminAPI.createMakingCharge(data);
        toast.success('Rule created');
      }
      setDialogOpen(false);
      fetchRules();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save rule');
    } finally {
      setSubmitting(false);
    }
  };

  const formatValue = (rule: MakingChargeRule) => {
    switch (rule.type) {
      case 'FLAT':
        return formatCurrency(rule.value);
      case 'PERCENTAGE':
        return `${rule.value}%`;
      case 'PER_GRAM':
        return `${formatCurrency(rule.value)}/g`;
      default:
        return String(rule.value);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Hammer className="h-6 w-6 text-[#722F37]" />
          <h1 className="text-2xl font-bold text-gray-900">Making Charge Rules</h1>
        </div>
        <Button onClick={openAdd}>
          <Plus className="h-4 w-4" />
          Add Rule
        </Button>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full rounded-lg" />
          ))}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Value</TableHead>
              <TableHead>Scope</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-12 text-center text-gray-400">
                  No making charge rules configured
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell className="font-medium text-gray-900">{rule.name}</TableCell>
                  <TableCell>
                    <Badge variant="info">{typeLabels[rule.type] || rule.type}</Badge>
                  </TableCell>
                  <TableCell className="font-medium">{formatValue(rule)}</TableCell>
                  <TableCell>
                    <Badge variant="default">
                      {scopeLabels[rule.scope] || rule.scope}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={rule.isActive ? 'success' : 'danger'}>
                      {rule.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(rule)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(rule)}
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
        title={editingRule ? 'Edit Making Charge Rule' : 'Add Making Charge Rule'}
      >
        <PricingMasterForm
          type="making-charge"
          defaultValues={
            editingRule
              ? {
                  name: editingRule.name,
                  type: editingRule.type,
                  value: editingRule.value,
                  scope: editingRule.scope as any,
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
