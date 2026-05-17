export const SITE_NAME = 'Jewelup by Sarita';
export const SITE_DESCRIPTION = 'Premium Silver & Gemstone Jewellery from Jaipur';
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';

export const PRODUCT_TYPES = [
  { name: 'Rings', slug: 'rings' },
  { name: 'Earrings', slug: 'earrings' },
  { name: 'Pendants', slug: 'pendants' },
  { name: 'Bracelets', slug: 'bracelets' },
  { name: 'Anklets', slug: 'anklets' },
  { name: 'Bangles', slug: 'bangles' },
  { name: 'Idols', slug: 'idols' },
  { name: 'Gifting', slug: 'gifting' },
];

export const OCCASIONS = [
  { name: 'Daily Wear', slug: 'daily-wear' },
  { name: 'Festive', slug: 'festive' },
  { name: 'Bridal', slug: 'bridal' },
  { name: 'Gifting', slug: 'gifting' },
];

export const GEMSTONE_TYPES = [
  { name: 'Emerald', slug: 'emerald' },
  { name: 'Ruby', slug: 'ruby' },
  { name: 'Sapphire', slug: 'sapphire' },
  { name: 'Topaz', slug: 'topaz' },
  { name: 'Garnet', slug: 'garnet' },
  { name: 'Amethyst', slug: 'amethyst' },
  { name: 'Pearl', slug: 'pearl' },
  { name: 'Turquoise', slug: 'turquoise' },
];

export const SILVER_PURITY = [
  { label: '925 Sterling Silver', value: 'STERLING_925' },
  { label: '999 Fine Silver', value: 'FINE_999' },
];

export const ORDER_STATUSES = [
  { value: 'PENDING', label: 'Pending', color: 'yellow' },
  { value: 'CONFIRMED', label: 'Confirmed', color: 'blue' },
  { value: 'PACKED', label: 'Packed', color: 'indigo' },
  { value: 'QUALITY_CHECKED', label: 'Quality Checked', color: 'purple' },
  { value: 'DISPATCHED', label: 'Dispatched', color: 'cyan' },
  { value: 'OUT_FOR_DELIVERY', label: 'Out for Delivery', color: 'orange' },
  { value: 'DELIVERED', label: 'Delivered', color: 'green' },
  { value: 'CANCELLED', label: 'Cancelled', color: 'red' },
  { value: 'RETURNED', label: 'Returned', color: 'gray' },
];

export const GST_RATE = 0.03;
export const FREE_SHIPPING_THRESHOLD = 2000;
export const INSURANCE_THRESHOLD = 10000;
export const PRICE_LOCK_MINUTES = 60;
