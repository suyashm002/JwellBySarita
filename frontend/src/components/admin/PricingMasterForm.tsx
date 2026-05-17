'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';

export interface GemstoneFormValues {
  name: string;
  type: string;
  qualityGrade: string;
  ratePerCarat: number;
}

export interface MakingChargeFormValues {
  name: string;
  type: 'FLAT' | 'PERCENTAGE' | 'PER_GRAM';
  value: number;
  scope: 'GLOBAL' | 'CATEGORY' | 'PRODUCT';
  scopeId?: string;
}

type FormValues = GemstoneFormValues | MakingChargeFormValues;

export interface PricingMasterFormProps {
  type: 'gemstone' | 'making-charge';
  defaultValues?: Partial<FormValues>;
  onSubmit: (data: FormValues) => void;
  onCancel?: () => void;
  loading?: boolean;
}

export function PricingMasterForm({
  type,
  defaultValues,
  onSubmit,
  onCancel,
  loading = false,
}: PricingMasterFormProps) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<any>({
    defaultValues: defaultValues || {},
  });

  if (type === 'gemstone') {
    return (
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          label="Gemstone Name"
          {...register('name', { required: 'Name is required' })}
          error={errors.name?.message as string}
          placeholder="e.g. Cubic Zirconia"
        />
        <Input
          label="Type"
          {...register('type', { required: 'Type is required' })}
          error={errors.type?.message as string}
          placeholder="e.g. Synthetic, Natural"
        />
        <Input
          label="Quality Grade"
          {...register('qualityGrade', { required: 'Quality grade is required' })}
          error={errors.qualityGrade?.message as string}
          placeholder="e.g. AAA, AA, A"
        />
        <Input
          label="Rate per Carat (INR)"
          type="number"
          step="0.01"
          {...register('ratePerCarat', {
            valueAsNumber: true,
            required: 'Rate is required',
            min: { value: 0.01, message: 'Must be positive' },
          })}
          error={errors.ratePerCarat?.message as string}
        />
        <div className="flex justify-end gap-3 pt-2">
          {onCancel && (
            <Button type="button" variant="secondary" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button type="submit" loading={loading}>
            {defaultValues?.name ? 'Update Rate' : 'Add Rate'}
          </Button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Rule Name"
        {...register('name', { required: 'Name is required' })}
        error={errors.name?.message as string}
        placeholder="e.g. Standard Making Charge"
      />
      <Select
        label="Type"
        options={[
          { value: 'FLAT', label: 'Flat Amount' },
          { value: 'PERCENTAGE', label: 'Percentage' },
          { value: 'PER_GRAM', label: 'Per Gram' },
        ]}
        {...register('type', { required: 'Type is required' })}
        error={errors.type?.message as string}
      />
      <Input
        label="Value"
        type="number"
        step="0.01"
        {...register('value', {
          valueAsNumber: true,
          required: 'Value is required',
          min: { value: 0, message: 'Must not be negative' },
        })}
        error={errors.value?.message as string}
      />
      <Select
        label="Scope"
        options={[
          { value: 'GLOBAL', label: 'Global (all products)' },
          { value: 'CATEGORY', label: 'Category-specific' },
          { value: 'PRODUCT', label: 'Product-specific' },
        ]}
        {...register('scope', { required: 'Scope is required' })}
        error={errors.scope?.message as string}
      />
      <div className="flex justify-end gap-3 pt-2">
        {onCancel && (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancel
          </Button>
        )}
        <Button type="submit" loading={loading}>
          {(defaultValues as any)?.name ? 'Update Rule' : 'Add Rule'}
        </Button>
      </div>
    </form>
  );
}
