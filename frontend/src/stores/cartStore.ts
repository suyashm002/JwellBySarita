import { create } from 'zustand';
import { CartItem, CartSummary } from '@/types/cart';
import { cartAPI } from '@/lib/api';
import toast from 'react-hot-toast';

interface CartState {
  items: CartItem[];
  itemCount: number;
  isLoading: boolean;
  isOpen: boolean;
  summary: CartSummary | null;
  fetchCart: () => Promise<void>;
  addItem: (productId: string, quantity?: number, variantId?: string) => Promise<void>;
  updateQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeItem: (itemId: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: () => Promise<void>;
  fetchSummary: () => Promise<void>;
  toggleCart: () => void;
  openCart: () => void;
  closeCart: () => void;
}

export const useCartStore = create<CartState>((set, get) => ({
  items: [],
  itemCount: 0,
  isLoading: false,
  isOpen: false,
  summary: null,

  fetchCart: async () => {
    try {
      set({ isLoading: true });
      const { data } = await cartAPI.get();
      const items = data.data?.items || [];
      set({ items, itemCount: items.reduce((sum: number, i: CartItem) => sum + i.quantity, 0), isLoading: false });
    } catch {
      set({ isLoading: false });
    }
  },

  addItem: async (productId, quantity = 1, variantId) => {
    try {
      await cartAPI.addItem(productId, quantity, variantId);
      await get().fetchCart();
      toast.success('Added to cart');
      set({ isOpen: true });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add to cart');
    }
  },

  updateQuantity: async (itemId, quantity) => {
    try {
      await cartAPI.updateItem(itemId, quantity);
      await get().fetchCart();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update');
    }
  },

  removeItem: async (itemId) => {
    try {
      await cartAPI.removeItem(itemId);
      await get().fetchCart();
      toast.success('Removed from cart');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to remove');
    }
  },

  clearCart: async () => {
    try {
      await cartAPI.clear();
      set({ items: [], itemCount: 0, summary: null });
    } catch {}
  },

  applyCoupon: async (code) => {
    try {
      await cartAPI.applyCoupon(code);
      await get().fetchSummary();
      toast.success('Coupon applied!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Invalid coupon');
    }
  },

  removeCoupon: async () => {
    try {
      await cartAPI.removeCoupon();
      await get().fetchSummary();
    } catch {}
  },

  fetchSummary: async () => {
    try {
      const { data } = await cartAPI.getSummary();
      set({ summary: data.data });
    } catch {}
  },

  toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));
