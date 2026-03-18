// User types
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  phoneVerified?: boolean;
  role: 'client' | 'admin' | 'superadmin' | 'entregador';
  createdat?: string;
}

export interface Deliverer {
  id: string;
  name: string;
  email: string;
  phone?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  tenantId?: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  password: string;
  phone?: string;
  address?: AddressInput;
  tenantId?: string;
}

export interface UpdateProfileRequest {
  name?: string;
  phone?: string;
  password?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

// Address types
export interface Address {
  id: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  isdefault: boolean;
  userid: string;
}

export interface AddressInput {
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  zipcode: string;
  isDefault?: boolean;
}

// Product types
export interface Product {
  id: string;
  name: string;
  category: 'Botijões' | 'Água' | 'Acessórios' | 'Serviços';
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
  createdat?: string;
}

export interface ProductInput {
  name: string;
  category: string;
  description: string;
  price: number;
  imageUrl: string;
  stock: number;
}

// Order types
export type OrderStatus = 'Pendente' | 'Em Preparo' | 'Saiu para Entrega' | 'Entregue' | 'Cancelado';
export type PaymentMethod = 'Dinheiro' | 'Pix' | 'Cartão';

export interface OrderItem {
  id: string;
  quantity: number;
  price: number;
  product: Product;
}

export interface Order {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  totalamount?: number; // Backwards compatibility
  paymentMethod: PaymentMethod;
  paymentmethod?: PaymentMethod; // Backwards compatibility
  observations?: string;
  cancelReason?: string;
  cancelreason?: string; // Backwards compatibility
  couponCode?: string;
  discountAmount?: number;
  cpfCnpj?: string;
  delivererId?: string;
  delivererName?: string;
  createdAt: string;
  createdat?: string; // Backwards compatibility
  updatedAt: string;
  updatedat?: string; // Backwards compatibility
  user: User;
  address: Address;
  items: OrderItem[];
}

export interface CreateOrderRequest {
  addressId: string;
  paymentMethod: PaymentMethod;
  observations?: string;
  couponCode?: string;
  cpfCnpj?: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
}

export interface UpdateOrderStatusRequest {
  status: OrderStatus;
}

export interface CancelOrderRequest {
  cancelReason: string;
}

// Cart types
export interface CartItem {
  product: Product;
  quantity: number;
}

// Report types
export interface DashboardStats {
  todayOrders: number;
  pendingOrders: number;
  inProgressOrders: number;
  todayRevenue: number;
  monthRevenue: number;
  recentOrders: Order[];
}

export interface OrdersReport {
  totalOrders: number;
  statusBreakdown: Array<{
    status: OrderStatus;
    count: number;
  }>;
}

export interface RevenueReport {
  totalRevenue: number;
  paymentMethodBreakdown: Array<{
    paymentMethod: PaymentMethod;
    total: number;
  }>;
}

export interface TopProductsReport {
  products: Array<{
    product: Product;
    quantitySold: number;
    revenue: number;
  }>;
}

// Client types
export interface Client extends User {
  orderCount?: number;
  addresses?: Address[];
}

// Coupon types
export interface Coupon {
  id: string;
  code: string;
  discounttype: 'percentage' | 'fixed';
  discountvalue: number;
  maxuses?: number;
  usedcount: number;
  isactive: boolean;
  expiresat?: string;
  createdat: string;
}

export interface ValidateCouponResponse {
  valid: boolean;
  discountAmount: number;
  coupon?: Coupon;
  message?: string;
}
