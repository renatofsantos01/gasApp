export interface Tenant {
  id: string;
  companyname: string;
  appname: string;
  subdomain: string;
  customdomain?: string;
  logourl?: string;
  splashscreenurl?: string;
  primarycolor: string;
  secondarycolor: string;
  email: string;
  phone?: string;
  isactive: boolean;
  createdat: string;
  updatedat: string;
}

export interface TenantFormData {
  companyname: string;
  appname: string;
  subdomain: string;
  email: string;
  phone?: string;
  primarycolor: string;
  secondarycolor: string;
  logourl?: string;
  splashscreenurl?: string;
  isactive: boolean;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  paymentMethod: string;
  observations?: string;
  cancelReason?: string;
  couponCode?: string;
  discountAmount?: number;
  createdAt: string;
  delivererId?: string;
  delivererName?: string;
  user: { name: string; email: string; phone?: string };
  address: {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipcode: string;
  };
  items: OrderItem[];
}

export interface OrderItem {
  quantity: number;
  price: number;
  subtotal: number;
  product: { name: string; imageUrl?: string; price: number };
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl?: string;
  stock: number;
}

export interface Deliverer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  available: boolean;
}
