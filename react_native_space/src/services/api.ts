import axios, { AxiosInstance, AxiosError } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';
import {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  UpdateProfileRequest,
  Product,
  ProductInput,
  Order,
  CreateOrderRequest,
  UpdateOrderStatusRequest,
  CancelOrderRequest,
  Address,
  AddressInput,
  DashboardStats,
  OrdersReport,
  RevenueReport,
  TopProductsReport,
  Client,
} from '../types';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://dc071db80.na105.preview.abacusai.app/';

const TOKEN_KEY = 'auth_token';

// Use SecureStore for mobile, AsyncStorage for web
const secureStorage = {
  async getItem(key: string): Promise<string | null> {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return await SecureStore.getItemAsync(key);
  },
  async setItem(key: string, value: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
    } else {
      await SecureStore.setItemAsync(key, value);
    }
  },
  async removeItem(key: string): Promise<void> {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};

class ApiService {
  public api: AxiosInstance;
  private onUnauthorized?: () => void;

  constructor() {
    this.api = axios.create({
      baseURL: API_URL,
      timeout: 15000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Request interceptor to add auth token
    this.api.interceptors.request.use(
      async (config) => {
        const token = await secureStorage.getItem(TOKEN_KEY);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor to handle 401
    this.api.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        if (error?.response?.status === 401) {
          await secureStorage.removeItem(TOKEN_KEY);
          this.onUnauthorized?.();
        }
        return Promise.reject(error);
      }
    );
  }

  setUnauthorizedHandler(handler: () => void) {
    this.onUnauthorized = handler;
  }

  async saveToken(token: string): Promise<void> {
    await secureStorage.setItem(TOKEN_KEY, token);
  }

  async getToken(): Promise<string | null> {
    return await secureStorage.getItem(TOKEN_KEY);
  }

  async removeToken(): Promise<void> {
    await secureStorage.removeItem(TOKEN_KEY);
  }

  // Auth endpoints
  async login(data: LoginRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/login', data);
    return response.data;
  }

  async register(data: RegisterRequest): Promise<AuthResponse> {
    const response = await this.api.post<AuthResponse>('/auth/register', data);
    return response.data;
  }

  async getProfile(): Promise<User> {
    const response = await this.api.get<User>('/auth/profile');
    return response.data;
  }

  async updateProfile(data: UpdateProfileRequest): Promise<User> {
    const response = await this.api.put<User>('/auth/profile', data);
    return response.data;
  }

  // Products endpoints
  async getProducts(category?: string): Promise<Product[]> {
    const response = await this.api.get<Product[]>('/products', {
      params: category ? { category } : {},
    });
    return response.data;
  }

  async getProduct(id: string): Promise<Product> {
    const response = await this.api.get<Product>(`/products/${id}`);
    return response.data;
  }

  async createProduct(data: ProductInput): Promise<Product> {
    const response = await this.api.post<Product>('/products', data);
    return response.data;
  }

  async updateProduct(id: string, data: Partial<ProductInput>): Promise<Product> {
    const response = await this.api.put<Product>(`/products/${id}`, data);
    return response.data;
  }

  async deleteProduct(id: string): Promise<void> {
    await this.api.delete(`/products/${id}`);
  }

  // Orders endpoints
  async createOrder(data: CreateOrderRequest): Promise<Order> {
    const response = await this.api.post<Order>('/orders', data);
    return response.data;
  }

  async getOrders(): Promise<Order[]> {
    const response = await this.api.get<Order[]>('/orders');
    return response.data;
  }

  async getOrder(id: string): Promise<Order> {
    const response = await this.api.get<Order>(`/orders/${id}`);
    return response.data;
  }

  async updateOrderStatus(id: string, data: UpdateOrderStatusRequest): Promise<Order> {
    const response = await this.api.patch<Order>(`/orders/${id}/status`, data);
    return response.data;
  }

  async cancelOrder(id: string, data: CancelOrderRequest): Promise<Order> {
    const response = await this.api.patch<Order>(`/orders/${id}/cancel`, data);
    return response.data;
  }

  // Addresses endpoints
  async getAddresses(): Promise<Address[]> {
    const response = await this.api.get<Address[]>('/addresses');
    return response.data;
  }

  async createAddress(data: AddressInput): Promise<Address> {
    const response = await this.api.post<Address>('/addresses', data);
    return response.data;
  }

  async updateAddress(id: string, data: Partial<AddressInput>): Promise<Address> {
    const response = await this.api.put<Address>(`/addresses/${id}`, data);
    return response.data;
  }

  async deleteAddress(id: string): Promise<void> {
    await this.api.delete(`/addresses/${id}`);
  }

  // Reports endpoints (Admin only)
  async getDashboard(): Promise<DashboardStats> {
    const response = await this.api.get<DashboardStats>('/reports/dashboard');
    return response.data;
  }

  async getOrdersReport(startDate?: string, endDate?: string): Promise<OrdersReport> {
    const response = await this.api.get<OrdersReport>('/reports/orders', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getRevenueReport(startDate?: string, endDate?: string): Promise<RevenueReport> {
    const response = await this.api.get<RevenueReport>('/reports/revenue', {
      params: { startDate, endDate },
    });
    return response.data;
  }

  async getTopProducts(startDate?: string, endDate?: string, limit?: number): Promise<TopProductsReport> {
    const response = await this.api.get<TopProductsReport>('/reports/top-products', {
      params: { startDate, endDate, limit },
    });
    return response.data;
  }

  // Users endpoints (Admin only)
  async getClients(): Promise<Client[]> {
    const response = await this.api.get<Client[]>('/users/clients');
    return response.data;
  }

  async getClient(id: string): Promise<Client> {
    const response = await this.api.get<Client>(`/users/clients/${id}`);
    return response.data;
  }
}

export const apiService = new ApiService();
export const api = apiService.api;
