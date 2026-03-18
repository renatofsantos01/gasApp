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
      window.location.href = '/login';
    }
    return Promise.reject(err);
  },
);

export const authApi = {
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }).then((r) => r.data),
};

export const tenantsApi = {
  findAll: () => api.get('/tenant').then((r) => r.data),
  findOne: (id: string) => api.get(`/tenant/${id}`).then((r) => r.data),
  create: (data: unknown) => api.post('/tenant', data).then((r) => r.data),
  update: (id: string, data: unknown) => api.put(`/tenant/${id}`, data).then((r) => r.data),
  toggleActive: (id: string) => api.patch(`/tenant/${id}/toggle-active`).then((r) => r.data),
  remove: (id: string) => api.delete(`/tenant/${id}`).then((r) => r.data),
};
