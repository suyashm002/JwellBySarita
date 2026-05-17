export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  status: OrderStatus;
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED';
  paymentMethod: string;
  addressSnapshot: any;
  subtotal: number;
  silverCost: number;
  gemstoneCost: number;
  makingCharges: number;
  additionalCharges: number;
  discountAmount: number;
  couponCode?: string;
  shippingCost: number;
  shippingInsurance: number;
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
  silverRateAtOrder: number;
  trackingNumber?: string;
  trackingUrl?: string;
  courierName?: string;
  estimatedDelivery?: string;
  giftWrap: boolean;
  giftMessage?: string;
  notes?: string;
  recoveryChannel?: string;
  items: OrderItem[];
  statusHistory?: OrderStatusHistory[];
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productSnapshot: any;
  variantId?: string;
  quantity: number;
  silverRateUsed: number;
  silverWeight: number;
  silverCost: number;
  gemstoneCost: number;
  makingCharge: number;
  additionalCharge: number;
  unitPrice: number;
  totalPrice: number;
}

export interface OrderStatusHistory {
  id: string;
  orderId: string;
  status: OrderStatus;
  note?: string;
  createdAt: string;
}

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKED'
  | 'QUALITY_CHECKED'
  | 'DISPATCHED'
  | 'OUT_FOR_DELIVERY'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'RETURNED';
