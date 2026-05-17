'use client';

import React, { useEffect, useState } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  ChevronRight,
  ChevronDown,
  FolderTree,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { Card, CardHeader, CardBody } from '@/components/ui/card';
import { categoryAPI, adminAPI } from '@/lib/api';
import { Category } from '@/types/product';
import toast from 'react-hot-toast';

const categoryTypes = [
  { value: '', label: 'All Types' },
  { value: 'PRODUCT_TYPE', label: 'Product Type' },
  { value: 'OCCASION', label: 'Occasion' },
  { value: 'GEMSTONE_TYPE', label: 'Gemstone Type' },
  { value: 'COLLECTION', label: 'Collection' },
];

interface CategoryFormData {
  name: string;
  description: string;
  type: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
}

function CategoryTreeItem({
  category,
  onEdit,
  onDelete,
  level = 0,
}: {
  category: Category;
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
  level?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const hasChildren = category.children && category.children.length > 0;

  return (
    <div>
      <div
        className="group flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-gray-50"
        style={{ paddingLeft: `${level * 24 + 12}px` }}
      >
        {hasChildren ? (
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 rounded p-0.5 text-gray-400 hover:text-gray-600"
          >
            {expanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </button>
        ) : (
          <span className="w-5" />
        )}

        <FolderTree className="h-4 w-4 shrink-0 text-gray-400" />

        <span className="flex-1 text-sm font-medium text-gray-900">{category.name}</span>

        <Badge variant={category.isActive ? 'success' : 'danger'} className="mr-2">
          {category.isActive ? 'Active' : 'Inactive'}
        </Badge>

        <span className="text-xs text-gray-400">
          {category._count?.products ?? 0} products
        </span>

        <div className="ml-2 flex items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
          <Button variant="ghost" size="sm" onClick={() => onEdit(category)}>
            <Edit className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(category)}
            className="text-red-500 hover:text-red-700"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {category.children!.map((child) => (
            <CategoryTreeItem
              key={child.id}
              category={child}
              onEdit={onEdit}
              onDelete={onDelete}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [flatCategories, setFlatCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState<CategoryFormData>({
    name: '',
    description: '',
    type: 'PRODUCT_TYPE',
    parentId: '',
    sortOrder: 0,
    isActive: true,
  });

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const [treeRes, flatRes] = await Promise.all([
        categoryAPI.getTree(typeFilter || undefined),
        categoryAPI.getAll(),
      ]);
      setCategories(treeRes.data.data || []);
      setFlatCategories(flatRes.data.data || []);
    } catch (err) {
      console.error('Failed to load categories:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [typeFilter]);

  const openAddDialog = () => {
    setEditingCategory(null);
    setForm({
      name: '',
      description: '',
      type: 'PRODUCT_TYPE',
      parentId: '',
      sortOrder: 0,
      isActive: true,
    });
    setDialogOpen(true);
  };

  const openEditDialog = (c: Category) => {
    setEditingCategory(c);
    setForm({
      name: c.name,
      description: c.description || '',
      type: c.type,
      parentId: c.parentId || '',
      sortOrder: c.sortOrder,
      isActive: c.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = async (c: Category) => {
    if (!window.confirm(`Delete "${c.name}"? This cannot be undone.`)) return;
    try {
      await adminAPI.deleteCategory(c.id);
      toast.success('Category deleted');
      fetchCategories();
    } catch {
      toast.error('Failed to delete category');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error('Name is required');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...form,
        parentId: form.parentId || undefined,
      };

      if (editingCategory) {
        await adminAPI.updateCategory(editingCategory.id, payload);
        toast.success('Category updated');
      } else {
        await adminAPI.createCategory(payload);
        toast.success('Category created');
      }
      setDialogOpen(false);
      fetchCategories();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to save category');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
        <Button onClick={openAddDialog}>
          <Plus className="h-4 w-4" />
          Add Category
        </Button>
      </div>

      {/* Filter */}
      <div className="max-w-xs">
        <Select
          options={categoryTypes}
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          label="Filter by Type"
        />
      </div>

      {/* Tree */}
      <Card>
        <CardHeader>
          <h2 className="text-lg font-semibold text-gray-900">Category Tree</h2>
        </CardHeader>
        <CardBody>
          {loading ? (
            <div className="space-y-3 py-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-3">
                  <div className="h-4 w-4 animate-pulse rounded bg-gray-200" />
                  <div className="h-4 flex-1 animate-pulse rounded bg-gray-200" />
                </div>
              ))}
            </div>
          ) : categories.length === 0 ? (
            <p className="py-8 text-center text-gray-400">No categories found</p>
          ) : (
            categories.map((cat) => (
              <CategoryTreeItem
                key={cat.id}
                category={cat}
                onEdit={openEditDialog}
                onDelete={handleDelete}
              />
            ))
          )}
        </CardBody>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog
        isOpen={dialogOpen}
        onClose={() => setDialogOpen(false)}
        title={editingCategory ? 'Edit Category' : 'Add Category'}
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Input
            label="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
          <Input
            label="Description"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <Select
            label="Type"
            options={categoryTypes.filter((t) => t.value !== '')}
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.target.value })}
          />
          <Select
            label="Parent Category"
            options={[
              { value: '', label: 'None (top-level)' },
              ...flatCategories
                .filter((c) => c.id !== editingCategory?.id)
                .map((c) => ({ value: c.id, label: c.name })),
            ]}
            value={form.parentId}
            onChange={(e) => setForm({ ...form, parentId: e.target.value })}
          />
          <Input
            label="Sort Order"
            type="number"
            value={form.sortOrder}
            onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
          />
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
              {editingCategory ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </Dialog>
    </div>
  );
}
