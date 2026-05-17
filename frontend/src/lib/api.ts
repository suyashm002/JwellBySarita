import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined' && !window.location.pathname.includes('/login')) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const authAPI = {
  register: (data: { name: string; email?: string; phone?: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email?: string; phone?: string; password: string }) =>
    api.post('/auth/login', data),
  requestOtp: (phone: string) => api.post('/auth/otp/request', { phone }),
  verifyOtp: (phone: string, otp: string) => api.post('/auth/otp/verify', { phone, otp }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
};

// Products
export const productAPI = {
  getAll: (params?: Record<string, any>) => api.get('/products', { params }),
  getBySlug: (slug: string) => api.get(`/products/${slug}`),
  getFeatured: (limit = 8) => api.get('/products/featured', { params: { limit } }),
  getBestsellers: (limit = 8) => api.get('/products/bestsellers', { params: { limit } }),
  getNewArrivals: (limit = 8) => api.get('/products/new-arrivals', { params: { limit } }),
  search: (query: string) => api.get('/products/search', { params: { q: query } }),
  getRelated: (id: string, limit = 4) => api.get(`/products/${id}/related`, { params: { limit } }),
};

// Categories
export const categoryAPI = {
  getAll: (type?: string) => api.get('/categories', { params: { type } }),
  getTree: (type?: string) => api.get('/categories/tree', { params: { type } }),
  getBySlug: (slug: string) => api.get(`/categories/${slug}`),
};

// Pricing
export const pricingAPI = {
  getSilverRate: () => api.get('/pricing/silver-rate'),
  getGemstoneRates: () => api.get('/pricing/gemstone-rates'),
  calculatePrice: (productId: string) => api.post(`/pricing/calculate/${productId}`),
};

// Cart
export const cartAPI = {
  get: () => api.get('/cart'),
  addItem: (productId: string, quantity = 1, variantId?: string) =>
    api.post('/cart/items', { productId, quantity, variantId }),
  updateItem: (itemId: string, quantity: number) =>
    api.put(`/cart/items/${itemId}`, { quantity }),
  removeItem: (itemId: string) => api.delete(`/cart/items/${itemId}`),
  clear: () => api.delete('/cart'),
  applyCoupon: (code: string) => api.post('/cart/coupon', { code }),
  removeCoupon: () => api.delete('/cart/coupon'),
  getSummary: () => api.get('/cart/summary'),
};

// Orders
export const orderAPI = {
  create: (data: any) => api.post('/orders', data),
  getAll: (params?: Record<string, any>) => api.get('/orders', { params }),
  getById: (id: string) => api.get(`/orders/${id}`),
  cancel: (id: string) => api.post(`/orders/${id}/cancel`),
  requestReturn: (id: string, data: any) => api.post(`/orders/${id}/return`, data),
  getInvoice: (id: string) => api.get(`/orders/${id}/invoice`),
};

// Payments
export const paymentAPI = {
  createOrder: (data: any) => api.post('/payments/create-order', data),
  verify: (data: any) => api.post('/payments/verify', data),
};

// Shipping
export const shippingAPI = {
  checkServiceability: (pincode: string) =>
    api.get('/shipping/serviceability', { params: { pincode } }),
  track: (orderId: string) => api.get(`/shipping/track/${orderId}`),
};

// User
export const userAPI = {
  getProfile: () => api.get('/users/profile'),
  updateProfile: (data: any) => api.put('/users/profile', data),
  getAddresses: () => api.get('/users/addresses'),
  addAddress: (data: any) => api.post('/users/addresses', data),
  updateAddress: (id: string, data: any) => api.put(`/users/addresses/${id}`, data),
  deleteAddress: (id: string) => api.delete(`/users/addresses/${id}`),
};

// Wishlist
export const wishlistAPI = {
  get: () => api.get('/wishlist'),
  add: (productId: string) => api.post('/wishlist', { productId }),
  remove: (productId: string) => api.delete(`/wishlist/${productId}`),
};

// Admin
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard/overview'),
  getSalesReport: (from?: string, to?: string) =>
    api.get('/admin/dashboard/sales-report', { params: { from, to } }),
  getGSTReport: (from?: string, to?: string) =>
    api.get('/admin/dashboard/gst-report', { params: { from, to } }),
  getInventoryValuation: () => api.get('/admin/dashboard/inventory-valuation'),

  // Products
  createProduct: (data: any) => api.post('/products', data),
  updateProduct: (id: string, data: any) => api.put(`/products/${id}`, data),
  deleteProduct: (id: string) => api.delete(`/products/${id}`),

  // Categories
  createCategory: (data: any) => api.post('/categories', data),
  updateCategory: (id: string, data: any) => api.put(`/categories/${id}`, data),
  deleteCategory: (id: string) => api.delete(`/categories/${id}`),

  // Pricing
  overrideSilverRate: (data: any) => api.post('/pricing/silver-rate/override', data),
  updateBuffer: (percent: number) => api.put('/pricing/silver-rate/buffer', { percent }),
  getSilverRateHistory: () => api.get('/pricing/silver-rate/history'),
  createGemstoneRate: (data: any) => api.post('/pricing/gemstone-rates', data),
  updateGemstoneRate: (id: string, data: any) => api.put(`/pricing/gemstone-rates/${id}`, data),
  deleteGemstoneRate: (id: string) => api.delete(`/pricing/gemstone-rates/${id}`),
  getMakingCharges: () => api.get('/pricing/making-charges'),
  createMakingCharge: (data: any) => api.post('/pricing/making-charges', data),
  updateMakingCharge: (id: string, data: any) => api.put(`/pricing/making-charges/${id}`, data),
  deleteMakingCharge: (id: string) => api.delete(`/pricing/making-charges/${id}`),

  // Orders
  getAllOrders: (params?: Record<string, any>) => api.get('/orders/admin/all', { params }),
  updateOrderStatus: (id: string, data: any) => api.put(`/orders/${id}/status`, data),
  getOrderStats: () => api.get('/orders/admin/stats'),

  // Abandoned Carts
  getAbandonedCarts: (params?: Record<string, any>) => api.get('/abandoned-carts', { params }),
  getRecoveryMetrics: (days?: number) =>
    api.get('/abandoned-carts/metrics', { params: { days } }),
  sendOutreach: (id: string, data: any) => api.post(`/abandoned-carts/${id}/outreach`, data),

  // Coupons
  getCoupons: (params?: Record<string, any>) => api.get('/coupons', { params }),
  createCoupon: (data: any) => api.post('/coupons', data),
  updateCoupon: (id: string, data: any) => api.put(`/coupons/${id}`, data),
  deleteCoupon: (id: string) => api.delete(`/coupons/${id}`),

  // Customers
  getCustomers: (params?: Record<string, any>) => api.get('/users/admin/customers', { params }),
  getCustomerDetail: (id: string) => api.get(`/users/admin/customers/${id}`),

  // Media
  uploadFiles: (files: FormData) =>
    api.post('/media/upload', files, { headers: { 'Content-Type': 'multipart/form-data' } }),

  // Meta Ads
  getMetaAccount: () => api.get('/meta-ads/account'),
  getMetaCampaigns: (params?: Record<string, any>) => api.get('/meta-ads/campaigns', { params }),
  createMetaCampaign: (data: any) => api.post('/meta-ads/campaigns', data),
  updateMetaCampaign: (id: string, data: any) => api.put(`/meta-ads/campaigns/${id}`, data),
  pauseMetaCampaign: (id: string) => api.post(`/meta-ads/campaigns/${id}/pause`),
  resumeMetaCampaign: (id: string) => api.post(`/meta-ads/campaigns/${id}/resume`),
  deleteMetaCampaign: (id: string) => api.delete(`/meta-ads/campaigns/${id}`),
  getMetaCampaignInsights: (id: string, params?: Record<string, any>) =>
    api.get(`/meta-ads/campaigns/${id}/insights`, { params }),
  getMetaAdSets: (campaignId: string) => api.get(`/meta-ads/campaigns/${campaignId}/adsets`),
  createMetaAdSet: (campaignId: string, data: any) =>
    api.post(`/meta-ads/campaigns/${campaignId}/adsets`, data),
  getMetaAds: (adSetId: string) => api.get(`/meta-ads/adsets/${adSetId}/ads`),
  createMetaAd: (adSetId: string, data: any) => api.post(`/meta-ads/adsets/${adSetId}/ads`, data),
  getMetaInsights: (params?: Record<string, any>) => api.get('/meta-ads/insights', { params }),
  syncMetaCatalog: () => api.post('/meta-ads/sync-catalog'),
  getMetaAudiences: () => api.get('/meta-ads/audiences'),
};

export default api;
