export interface User {
  id: string;
  email: string | null;
  phone: string | null;
  name: string;
  role: 'CUSTOMER' | 'ADMIN' | 'STAFF';
  isActive: boolean;
}

export interface Address {
  id: string;
  userId: string;
  label: string;
  name: string;
  phone: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}
