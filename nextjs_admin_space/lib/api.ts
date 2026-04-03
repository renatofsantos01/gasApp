import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export const api = axios.create({ baseURL: API_URL });

// Injeta token em todas as requisições
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('admin_token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Redireciona para login em caso de 401
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('admin_token');
      localStorage.removeItem('admin_role');
      localStorage.removeItem('admin_tenantId');
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string, tenantId?: string) =>
    api.post('/auth/login', { email, password, tenantId }).then((r) => r.data),

  getTenantBySubdomain: (subdomain: string) =>
    api.get(`/tenant/subdomain/${subdomain}`).then((r) => r.data),
};

export const tenantsApi = {
  findAll: () => api.get('/tenant').then((r) => r.data),
  findOne: (id: string) => api.get(`/tenant/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/tenant', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/tenant/${id}`, data).then((r) => r.data),
  toggleActive: (id: string) => api.patch(`/tenant/${id}/toggle-active`).then((r) => r.data),
  remove: (id: string) => api.delete(`/tenant/${id}`).then((r) => r.data),
};

export const ordersApi = {
  findAll: () => api.get('/orders').then((r) => r.data?.data ?? r.data),
  updateStatus: (id: string, status: string) =>
    api.patch(`/orders/${id}/status`, { status }).then((r) => r.data),
  assignDeliverer: (orderId: string, delivererId: string) =>
    api.patch(`/orders/${orderId}/assign`, { delivererId }).then((r) => r.data),
  cancel: (id: string, cancelReason: string) =>
    api.patch(`/orders/${id}/cancel`, { cancelReason }).then((r) => r.data),
};

export const productsApi = {
  findAll: () => api.get('/products').then((r) => r.data),
  create: (data: unknown) => api.post('/products', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/products/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/products/${id}`).then((r) => r.data),
};

export const deliverersApi = {
  findAll: () => api.get('/users/deliverers').then((r) => r.data),
  create: (data: unknown) => api.post('/users/deliverers', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/users/deliverers/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/users/deliverers/${id}`).then((r) => r.data),
};

export const reportsApi = {
  getOrders: (startDate: string, endDate: string) =>
    api.get('/reports/orders', { params: { startDate, endDate } }).then((r) => r.data),
  getRevenue: (startDate: string, endDate: string) =>
    api.get('/reports/revenue', { params: { startDate, endDate } }).then((r) => r.data),
  getTopProducts: (startDate: string, endDate: string) =>
    api.get('/reports/top-products', { params: { startDate, endDate, limit: 10 } }).then((r) => r.data),
};
