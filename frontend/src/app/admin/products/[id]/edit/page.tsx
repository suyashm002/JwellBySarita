'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ProductForm, ProductFormValues } from '@/components/admin/ProductForm';
import { adminAPI, categoryAPI, productAPI } from '@/lib/api';
import { Category, Product } from '@/types/product';
import { Skeleton } from '@/components/ui/skeleton';
import toast from 'react-hot-toast';

export default function EditProductPage() {
  const router = useRouter();
  const params = useParams();
  const productId = params.id as string;

  const [product, setProduct] = useState<Product | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [productRes, categoryRes] = await Promise.all([
          productAPI.getBySlug(productId),
          categoryAPI.getAll(),
        ]);
        setProduct(productRes.data.data);
        setCategories(categoryRes.data.data || []);
      } catch (err) {
        toast.error('Failed to load product');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [productId]);

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

      if (existingImages.length > 0) {
        formData.append('existingImages', JSON.stringify(existingImages));
      }

      if (images && images.length > 0) {
        images.forEach((file) => formData.append('images', file));
      }

      await adminAPI.updateProduct(productId, formData);
      toast.success('Product updated successfully');
      router.push('/admin/products');
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to update product');
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

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-gray-500">Product not found</p>
      </div>
    );
  }

  const defaultValues: Partial<ProductFormValues> = {
    name: product.name,
    sku: product.sku,
    description: product.description,
    shortDescription: product.shortDescription || '',
    categoryId: product.categoryId,
    silverPurity: product.silverPurity,
    silverWeightGrams: product.silverWeightGrams,
    makingChargeType: product.makingChargeType,
    makingChargeValue: product.makingChargeValue,
    additionalCharges: product.additionalCharges,
    gemstones: product.gemstones?.map((g) => ({
      gemstoneRateId: g.gemstoneRateId,
      type: g.gemstoneRate?.type || '',
      qualityGrade: g.gemstoneRate?.qualityGrade || '',
      caratWeight: g.caratWeight,
      quantity: g.quantity,
    })) || [],
    existingImages: product.images?.map((img) => ({
      id: img.id,
      url: img.url,
      isPrimary: img.isPrimary,
    })) || [],
    variants: product.variants?.map((v) => ({
      name: v.name,
      type: v.type,
      value: v.value,
      additionalPrice: v.additionalPrice,
      stock: v.stock,
      sku: v.sku,
    })) || [],
    metaTitle: product.metaTitle || '',
    metaDescription: product.metaDescription || '',
    stock: product.stock,
    lowStockThreshold: product.lowStockThreshold,
    isFeatured: product.isFeatured,
    isBestseller: product.isBestseller,
    isNewArrival: product.isNewArrival,
    isActive: product.isActive,
    tags: product.tags?.join(', ') || '',
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-500">Update &ldquo;{product.name}&rdquo;</p>
      </div>
      <ProductForm
        defaultValues={defaultValues}
        categories={categories}
        onSubmit={handleSubmit}
        loading={submitting}
      />
    </div>
  );
}
