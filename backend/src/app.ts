import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { RedisStore } from 'connect-redis';
import redis from './config/redis';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';
import { apiLimiter } from './middleware/rateLimiter';

// Route imports
import authRoutes from './modules/auth/auth.routes';
import userRoutes from './modules/user/user.routes';
import productRoutes from './modules/product/product.routes';
import categoryRoutes from './modules/category/category.routes';
import pricingRoutes from './modules/pricing/pricing.routes';
import cartRoutes from './modules/cart/cart.routes';
import orderRoutes from './modules/order/order.routes';
import paymentRoutes from './modules/payment/payment.routes';
import shippingRoutes from './modules/shipping/shipping.routes';
import abandonedCartRoutes from './modules/abandoned-cart/abandonedCart.routes';
import couponRoutes from './modules/coupon/coupon.routes';
import wishlistRoutes from './modules/wishlist/wishlist.routes';
import dashboardRoutes from './modules/admin/dashboard.routes';
import mediaRoutes from './modules/media/media.routes';
import metaAdsRoutes from './modules/meta-ads/meta-ads.routes';

const app = express();

// Security
app.use(helmet());
app.use(cors({
  origin: config.FRONTEND_URL,
  credentials: true,
}));

// Body parsers
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session
const redisStore = new RedisStore({ client: redis });
app.use(
  session({
    store: redisStore,
    secret: config.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: config.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      sameSite: config.NODE_ENV === 'production' ? 'strict' : 'lax',
    },
  })
);

// Rate limiting
app.use('/api/', apiLimiter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/pricing', pricingRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/abandoned-carts', abandonedCartRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/admin/dashboard', dashboardRoutes);
app.use('/api/media', mediaRoutes);
app.use('/api/meta-ads', metaAdsRoutes);

// Error handler (must be last)
app.use(errorHandler);

export default app;
