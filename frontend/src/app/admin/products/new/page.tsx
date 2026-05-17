'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProductForm, ProductFormValues } from '@/components/admin/ProductForm';
import { adminAPI, categoryAPI } from '@/lib/api';
import { Category } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

export default function CreateProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    categoryAPI
      .getAll()
      .then((res) => setCategories(res.data.data || []))
      .catch(() => toast.error('Failed to load categories'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (data: ProductFormValues) => {
    try {
      setSubmitting(true);

      const formData = new FormData();
      const { images, existingImages, tags, gemstones, variants, ...rest } = data;

      Object.entries(rest).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          formData.append(key, String(value));
        }
      });

      if (tags) {
        formData.append('tags', tags);
      }

      if (gemstones.length > 0) {
        formData.append('gemstones', JSON.stringify(gemstones));
      }

      if (variants.length > 0) {
        formData.append('variants', JSON.stringify(variants));
      }

      if (images && images.length > 0) {
        images.forEach((file) => formData.append('images', file));
      }

      await adminAPI.createProduct(formData);
      toast.success('Product created successfully');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to create product');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Create Product</h1>
        <p className="mt-1 text-sm text-gray-500">Add a new product to your store</p>
      </div>
      <ProductForm
        categories={categories}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
