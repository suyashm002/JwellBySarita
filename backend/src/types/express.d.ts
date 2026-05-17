import 'express-session';

declare module 'express-session' {
  interface SessionData {
    userId: string;
    role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
    cartId?: string;
  }
}

declare module 'express' {
  interface Request {
    user?: {
      id: string;
      email: string | null;
      phone: string | null;
      name: string | null;
      role: string;
    };
  }
}
