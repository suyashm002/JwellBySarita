import { Product, PriceBreakdown, ProductVariant } from './product';

export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  product: Product;
  variantId?: string;
  variant?: ProductVariant;
  quantity: number;
  lockedSilverRate?: number;
  lockedAt?: string;
  pricing?: PriceBreakdown;
}

export interface Cart {
  id: string;
  userId?: string;
  sessionId?: string;
  items: CartItem[];
  isAbandoned: boolean;
  priceLockExpiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CartSummary {
  items: CartItem[];
  itemsTotal: number;
  discount: number;
  couponCode?: string;
  shippingCost: number;
  shippingInsurance: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
  priceLockValid: boolean;
  priceChanged: boolean;
}
