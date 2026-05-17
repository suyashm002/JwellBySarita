import prisma from '../../config/database';
import { AppError } from '../../middleware/errorHandler';
import type { CreateCategoryInput, UpdateCategoryInput } from './category.schema';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export class CategoryService {
  async getAll(type?: string) {
    const where: Record<string, unknown> = {};
    if (type) {
      where.type = type;
    }

    const categories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: {
            children: true,
            products: true,
          },
        },
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    return categories.map((cat) => ({
      ...cat,
      childrenCount: cat._count.children,
      productCount: cat._count.products,
      _count: undefined,
    }));
  }

  async getBySlug(slug: string) {
    const category = await prisma.category.findUnique({
      where: { slug },
      include: {
        children: {
          where: { isActive: true },
          orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
        },
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return {
      ...category,
      childrenCount: category._count.children,
      productCount: category._count.products,
      _count: undefined,
    };
  }

  async getById(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        children: true,
        parent: {
          select: { id: true, name: true, slug: true },
        },
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    return category;
  }

  async create(data: CreateCategoryInput) {
    const slug = data.slug || slugify(data.name);

    // Check for duplicate slug
    const existing = await prisma.category.findUnique({ where: { slug } });
    if (existing) {
      throw new AppError('A category with this slug already exists', 409);
    }

    // Validate parentId if provided
    if (data.parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }
    }

    const category = await prisma.category.create({
      data: {
        name: data.name,
        slug,
        description: data.description,
        image: data.image,
        parentId: data.parentId,
        type: data.type,
        isActive: data.isActive,
        sortOrder: data.sortOrder ?? 0,
        metaTitle: data.metaTitle,
        metaDescription: data.metaDescription,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return category;
  }

  async update(id: string, data: UpdateCategoryInput) {
    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError('Category not found', 404);
    }

    // If slug is being changed, check for duplicates
    if (data.slug && data.slug !== existing.slug) {
      const slugExists = await prisma.category.findUnique({
        where: { slug: data.slug },
      });
      if (slugExists) {
        throw new AppError('A category with this slug already exists', 409);
      }
    }

    // Auto-generate slug if name changed and slug not provided
    let slug = data.slug;
    if (data.name && !data.slug) {
      slug = slugify(data.name);
      if (slug !== existing.slug) {
        const slugExists = await prisma.category.findUnique({ where: { slug } });
        if (slugExists) {
          slug = `${slug}-${Date.now()}`;
        }
      }
    }

    // Validate parentId if provided
    if (data.parentId) {
      if (data.parentId === id) {
        throw new AppError('A category cannot be its own parent', 400);
      }
      const parent = await prisma.category.findUnique({
        where: { id: data.parentId },
      });
      if (!parent) {
        throw new AppError('Parent category not found', 404);
      }
    }

    const category = await prisma.category.update({
      where: { id },
      data: {
        ...data,
        slug: slug ?? undefined,
      },
      include: {
        parent: {
          select: { id: true, name: true, slug: true },
        },
      },
    });

    return category;
  }

  async delete(id: string) {
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { products: true, children: true },
        },
      },
    });

    if (!category) {
      throw new AppError('Category not found', 404);
    }

    if (category._count.products > 0) {
      throw new AppError(
        `Cannot delete category: ${category._count.products} product(s) are assigned to it. Reassign them first.`,
        400
      );
    }

    if (category._count.children > 0) {
      throw new AppError(
        `Cannot delete category: ${category._count.children} child category(ies) exist. Remove or reassign them first.`,
        400
      );
    }

    await prisma.category.delete({ where: { id } });

    return { message: 'Category deleted successfully' };
  }

  async getTree(type?: string) {
    const where: Record<string, unknown> = { isActive: true };
    if (type) {
      where.type = type;
    }

    const allCategories = await prisma.category.findMany({
      where,
      include: {
        _count: {
          select: { products: true },
        },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });

    // Build tree from flat list
    const categoryMap = new Map<string, Record<string, unknown>>();
    const roots: Record<string, unknown>[] = [];

    // First pass: create map entries
    for (const cat of allCategories) {
      categoryMap.set(cat.id, {
        ...cat,
        productCount: cat._count.products,
        _count: undefined,
        children: [],
      });
    }

    // Second pass: build parent-child relationships
    for (const cat of allCategories) {
      const node = categoryMap.get(cat.id)!;
      if (cat.parentId && categoryMap.has(cat.parentId)) {
        const parent = categoryMap.get(cat.parentId)!;
        (parent.children as Record<string, unknown>[]).push(node);
      } else {
        roots.push(node);
      }
    }

    return roots;
  }
}

export const categoryService = new CategoryService();
