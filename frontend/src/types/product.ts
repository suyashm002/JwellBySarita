export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  description: string;
  shortDescription?: string;
  categoryId: string;
  category?: Category;
  silverPurity: 'STERLING_925' | 'FINE_999';
  silverWeightGrams: number;
  makingChargeType: 'FLAT' | 'PERCENTAGE' | 'PER_GRAM';
  makingChargeValue: number;
  additionalCharges: number;
  isActive: boolean;
  isFeatured: boolean;
  isBestseller: boolean;
  isNewArrival: boolean;
  stock: number;
  lowStockThreshold: number;
  metaTitle?: string;
  metaDescription?: string;
  tags: string[];
  images: ProductImage[];
  gemstones: ProductGemstone[];
  variants?: ProductVariant[];
  pricing?: PriceBreakdown;
  createdAt: string;
  updatedAt: string;
}

export interface ProductImage {
  id: string;
  url: string;
  altText?: string;
  sortOrder: number;
  isPrimary: boolean;
}

export interface ProductGemstone {
  id: string;
  gemstoneRateId: string;
  gemstoneRate: GemstoneRate;
  caratWeight: number;
  quantity: number;
}

export interface GemstoneRate {
  id: string;
  name: string;
  type: string;
  qualityGrade: string;
  ratePerCarat: number;
  isActive: boolean;
  effectiveFrom: string;
}

export interface ProductVariant {
  id: string;
  name: string;
  type: string;
  value: string;
  additionalPrice: number;
  stock: number;
  sku: string;
  isActive: boolean;
}

export interface PriceBreakdown {
  silverCost: number;
  gemstoneCost: number;
  makingCharge: number;
  additionalCharges: number;
  subtotal: number;
  cgst: number;
  sgst: number;
  totalGst: number;
  total: number;
  silverRateUsed: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  type: 'PRODUCT_TYPE' | 'OCCASION' | 'GEMSTONE_TYPE' | 'COLLECTION';
  isActive: boolean;
  sortOrder: number;
  children?: Category[];
  _count?: { products: number };
}

export interface ProductFilters {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categoryId?: string;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
  silverPurity?: string;
  gemstoneType?: string;
  isFeatured?: boolean;
  isBestseller?: boolean;
  isNewArrival?: boolean;
}
