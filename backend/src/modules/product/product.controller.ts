import { Request, Response, NextFunction } from 'express';
import { productService } from './product.service';
import { sendSuccess, sendPaginated } from '../../utils/apiResponse';
import type { ProductQueryInput } from './product.schema';

export class ProductController {
  async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const query: ProductQueryInput = {
        page: parseInt(req.query.page as string) || 1,
        limit: parseInt(req.query.limit as string) || 20,
        sortBy: (req.query.sortBy as string) || 'createdAt',
        sortOrder: (req.query.sortOrder as 'asc' | 'desc') || 'desc',
        categoryId: req.query.categoryId as string | undefined,
        search: req.query.search as string | undefined,
        silverPurity: req.query.silverPurity as string | undefined,
        gemstoneType: req.query.gemstoneType as string | undefined,
        isFeatured: req.query.isFeatured === 'true' ? true : undefined,
        isBestseller: req.query.isBestseller === 'true' ? true : undefined,
        isNewArrival: req.query.isNewArrival === 'true' ? true : undefined,
      };
      const { products, total, page, limit } = await productService.getAll(query);
      sendPaginated(res, products, total, page, limit, 'Products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    try {
      const q = (req.query.q as string) || '';
      if (!q.trim()) {
        return sendSuccess(res, [], 'No search query provided');
      }
      const products = await productService.search(q.trim());
      sendSuccess(res, products, 'Search results retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getFeatured(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await productService.getFeatured(limit);
      sendSuccess(res, products, 'Featured products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getBestsellers(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await productService.getBestsellers(limit);
      sendSuccess(res, products, 'Bestseller products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getNewArrivals(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const products = await productService.getNewArrivals(limit);
      sendSuccess(res, products, 'New arrival products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async getBySlug(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.getBySlug(req.params.slug);
      sendSuccess(res, product, 'Product retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.create(req.body);
      sendSuccess(res, product, 'Product created successfully', 201);
    } catch (error) {
      next(error);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const product = await productService.update(req.params.id, req.body);
      sendSuccess(res, product, 'Product updated successfully');
    } catch (error) {
      next(error);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await productService.delete(req.params.id);
      sendSuccess(res, result, 'Product deleted successfully');
    } catch (error) {
      next(error);
    }
  }

  async getRelated(req: Request, res: Response, next: NextFunction) {
    try {
      const limit = parseInt(req.query.limit as string) || 8;
      const products = await productService.getRelated(req.params.id, limit);
      sendSuccess(res, products, 'Related products retrieved successfully');
    } catch (error) {
      next(error);
    }
  }

  async bulkUpdateStock(req: Request, res: Response, next: NextFunction) {
    try {
      const results = await productService.bulkUpdateStock(req.body.updates);
      sendSuccess(res, results, 'Stock updated successfully');
    } catch (error) {
      next(error);
    }
  }
}

export const productController = new ProductController();
