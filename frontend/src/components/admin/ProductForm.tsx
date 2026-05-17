'use client';

import React, { useState, useCallback } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import {
  Plus,
  Trash2,
  Upload,
  X,
  GripVertical,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { Category } from '@/types/product';

export interface ProductFormValues {
  name: string;
  sku: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  silverPurity: 'STERLING_925' | 'FINE_999';
  silverWeightGrams: number;
  makingChargeType: 'FLAT' | 'PERCENTAGE' | 'PER_GRAM';
  makingChargeValue: number;
  additionalCharges: number;
  gemstones: {
    gemstoneRateId: string;
    type: string;
    qualityGrade: string;
    caratWeight: number;
    quantity: number;
  }[];
  images: File[];
  existingImages: { id: string; url: string; isPrimary: boolean }[];
  variants: {
    name: string;
    type: string;
    value: string;
    additionalPrice: number;
    stock: number;
    sku: string;
  }[];
  metaTitle: string;
  metaDescription: string;
  stock: number;
  lowStockThreshold: number;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  isActive: boolean;
  tags: string;
}

export interface ProductFormProps {
  defaultValues?: Partial<ProductFormValues>;
  categories?: Category[];
  onSubmit: (data: ProductFormValues) => void;
  loading?: boolean;
}

interface SectionProps {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}

function Section({ title, defaultOpen = true, children }: SectionProps) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-6 py-4 text-left"
      >
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {open ? (
          <ChevronUp className="h-5 w-5 text-gray-400" />
        ) : (
          <ChevronDown className="h-5 w-5 text-gray-400" />
        )}
      </button>
      {open && <div className="border-t border-gray-100 px-6 py-4 space-y-4">{children}</div>}
    </div>
  );
}

export function ProductForm({
  defaultValues,
  categories = [],
  onSubmit,
  loading = false,
}: ProductFormProps) {
  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    watch,
  } = useForm<ProductFormValues>({
    defaultValues: {
      name: '',
      sku: '',
      description: '',
      shortDescription: '',
      categoryId: '',
      silverPurity: 'STERLING_925',
      silverWeightGrams: 0,
      makingChargeType: 'FLAT',
      makingChargeValue: 0,
      additionalCharges: 0,
      gemstones: [],
      images: [],
      existingImages: [],
      variants: [],
      metaTitle: '',
      metaDescription: '',
      stock: 0,
      lowStockThreshold: 5,
      isFeatured: false,
      isBestseller: false,
      isNewArrival: false,
      isActive: true,
      tags: '',
      ...defaultValues,
    },
  });

  const {
    fields: gemstoneFields,
    append: addGemstone,
    remove: removeGemstone,
  } = useFieldArray({ control, name: 'gemstones' });

  const {
    fields: variantFields,
    append: addVariant,
    remove: removeVariant,
  } = useFieldArray({ control, name: 'variants' });

  const [imagePreview, setImagePreview] = useState<string[]>([]);
  const existingImages = watch('existingImages') || [];

  const handleImageChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      const previews = files.map((f) => URL.createObjectURL(f));
      setImagePreview((prev) => [...prev, ...previews]);
    },
    []
  );

  const removeImagePreview = (index: number) => {
    setImagePreview((prev) => prev.filter((_, i) => i !== index));
  };

  const categoryOptions = categories.map((c) => ({ value: c.id, label: c.name }));

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Info */}
      <Section title="Basic Information">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Product Name"
            {...register('name', { required: 'Name is required' })}
            error={errors.name?.message}
          />
          <Input
            label="SKU"
            {...register('sku', { required: 'SKU is required' })}
            error={errors.sku?.message}
          />
        </div>
        <Input
          label="Short Description"
          {...register('shortDescription')}
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            {...register('description', { required: 'Description is required' })}
            rows={4}
            className={cn(
              'flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400',
              'transition-colors duration-200',
              'focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20',
              errors.description && 'border-red-500'
            )}
          />
          {errors.description && (
            <p className="text-xs text-red-600">{errors.description.message}</p>
          )}
        </div>
        <Input label="Tags (comma-separated)" {...register('tags')} />
      </Section>

      {/* Category */}
      <Section title="Category">
        <Select
          label="Category"
          options={categoryOptions}
          placeholder="Select a category"
          {...register('categoryId', { required: 'Category is required' })}
          error={errors.categoryId?.message}
        />
      </Section>

      {/* Silver Details */}
      <Section title="Silver Details">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Silver Purity"
            options={[
              { value: 'STERLING_925', label: 'Sterling 925' },
              { value: 'FINE_999', label: 'Fine 999' },
            ]}
            {...register('silverPurity')}
          />
          <Input
            label="Silver Weight (grams)"
            type="number"
            step="0.01"
            {...register('silverWeightGrams', {
              valueAsNumber: true,
              required: 'Weight is required',
              min: { value: 0.01, message: 'Must be positive' },
            })}
            error={errors.silverWeightGrams?.message}
          />
        </div>
      </Section>

      {/* Making Charges */}
      <Section title="Making Charges">
        <div className="grid gap-4 sm:grid-cols-2">
          <Select
            label="Charge Type"
            options={[
              { value: 'FLAT', label: 'Flat Amount' },
              { value: 'PERCENTAGE', label: 'Percentage' },
              { value: 'PER_GRAM', label: 'Per Gram' },
            ]}
            {...register('makingChargeType')}
          />
          <Input
            label="Charge Value"
            type="number"
            step="0.01"
            {...register('makingChargeValue', { valueAsNumber: true })}
          />
        </div>
        <Input
          label="Additional Charges"
          type="number"
          step="0.01"
          {...register('additionalCharges', { valueAsNumber: true })}
        />
      </Section>

      {/* Gemstone Configuration */}
      <Section title="Gemstone Configuration">
        {gemstoneFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4"
          >
            <GripVertical className="mt-2 h-4 w-4 shrink-0 text-gray-300" />
            <div className="grid flex-1 gap-3 sm:grid-cols-4">
              <Input
                label="Type"
                placeholder="e.g. Zircon"
                {...register(`gemstones.${index}.type`)}
              />
              <Input
                label="Quality"
                placeholder="e.g. AAA"
                {...register(`gemstones.${index}.qualityGrade`)}
              />
              <Input
                label="Carat Weight"
                type="number"
                step="0.01"
                {...register(`gemstones.${index}.caratWeight`, { valueAsNumber: true })}
              />
              <Input
                label="Quantity"
                type="number"
                {...register(`gemstones.${index}.quantity`, { valueAsNumber: true })}
              />
            </div>
            <button
              type="button"
              onClick={() => removeGemstone(index)}
              className="mt-7 shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            addGemstone({
              gemstoneRateId: '',
              type: '',
              qualityGrade: '',
              caratWeight: 0,
              quantity: 1,
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add Gemstone
        </Button>
      </Section>

      {/* Images */}
      <Section title="Images">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 md:grid-cols-6">
          {existingImages.map((img, i) => (
            <div key={img.id} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
              <img
                src={img.url}
                alt=""
                className="h-full w-full object-cover"
              />
              {img.isPrimary && (
                <span className="absolute left-1 top-1 rounded bg-[#722F37] px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Primary
                </span>
              )}
            </div>
          ))}
          {imagePreview.map((src, i) => (
            <div key={i} className="group relative aspect-square overflow-hidden rounded-lg border border-gray-200">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button
                type="button"
                onClick={() => removeImagePreview(i)}
                className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white opacity-0 transition-opacity group-hover:opacity-100"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 text-gray-400 transition-colors hover:border-[#B76E79] hover:text-[#722F37]">
            <Upload className="h-6 w-6" />
            <span className="text-xs font-medium">Upload</span>
            <input
              type="file"
              multiple
              accept="image/*"
              className="hidden"
              onChange={handleImageChange}
            />
          </label>
        </div>
      </Section>

      {/* Variants */}
      <Section title="Variants (Sizes / Lengths)">
        {variantFields.map((field, index) => (
          <div
            key={field.id}
            className="flex items-start gap-3 rounded-lg border border-gray-100 bg-gray-50/50 p-4"
          >
            <div className="grid flex-1 gap-3 sm:grid-cols-5">
              <Input
                label="Name"
                placeholder="e.g. Ring Size 16"
                {...register(`variants.${index}.name`)}
              />
              <Select
                label="Type"
                options={[
                  { value: 'RING_SIZE', label: 'Ring Size' },
                  { value: 'CHAIN_LENGTH', label: 'Chain Length' },
                  { value: 'BANGLE_SIZE', label: 'Bangle Size' },
                  { value: 'OTHER', label: 'Other' },
                ]}
                {...register(`variants.${index}.type`)}
              />
              <Input
                label="Value"
                placeholder="e.g. 16"
                {...register(`variants.${index}.value`)}
              />
              <Input
                label="Addl. Price"
                type="number"
                step="0.01"
                {...register(`variants.${index}.additionalPrice`, { valueAsNumber: true })}
              />
              <Input
                label="Stock"
                type="number"
                {...register(`variants.${index}.stock`, { valueAsNumber: true })}
              />
            </div>
            <button
              type="button"
              onClick={() => removeVariant(index)}
              className="mt-7 shrink-0 rounded-lg p-2 text-red-500 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() =>
            addVariant({
              name: '',
              type: 'RING_SIZE',
              value: '',
              additionalPrice: 0,
              stock: 0,
              sku: '',
            })
          }
        >
          <Plus className="h-4 w-4" />
          Add Variant
        </Button>
      </Section>

      {/* SEO */}
      <Section title="SEO" defaultOpen={false}>
        <Input
          label="Meta Title"
          {...register('metaTitle')}
          placeholder="Page title for search engines"
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">Meta Description</label>
          <textarea
            {...register('metaDescription')}
            rows={3}
            placeholder="Short description for search results"
            className="flex w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 transition-colors duration-200 focus:border-[#B76E79] focus:outline-none focus:ring-2 focus:ring-[#B76E79]/20"
          />
        </div>
      </Section>

      {/* Stock & Visibility */}
      <Section title="Stock & Visibility">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Stock Count"
            type="number"
            {...register('stock', { valueAsNumber: true })}
          />
          <Input
            label="Low Stock Threshold"
            type="number"
            {...register('lowStockThreshold', { valueAsNumber: true })}
          />
        </div>
        <div className="flex flex-wrap gap-6 pt-2">
          {[
            { name: 'isActive' as const, label: 'Active' },
            { name: 'isFeatured' as const, label: 'Featured' },
            { name: 'isBestseller' as const, label: 'Bestseller' },
            { name: 'isNewArrival' as const, label: 'New Arrival' },
          ].map((toggle) => (
            <label key={toggle.name} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                {...register(toggle.name)}
                className="h-4 w-4 rounded border-gray-300 text-[#722F37] focus:ring-[#B76E79]"
              />
              {toggle.label}
            </label>
          ))}
        </div>
      </Section>

      {/* Submit */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={() => window.history.back()}>
          Cancel
        </Button>
        <Button type="submit" loading={loading}>
          {defaultValues?.name ? 'Update Product' : 'Create Product'}
        </Button>
      </div>
    </form>
  );
}
