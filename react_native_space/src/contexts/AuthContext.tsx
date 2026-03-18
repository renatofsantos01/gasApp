import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { notificationsService } from '../services/notificationsService';
import { User, LoginRequest, RegisterRequest } from '../types';
import { TenantConfig, tenantService } from '../services/tenantService';

const TENANT_SUBDOMAIN = process.env.EXPO_PUBLIC_TENANT_SUBDOMAIN || '';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantId: string | null;
  tenantConfig: TenantConfig | null;
  tenantError: boolean;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  retryTenant: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);
  const [tenantError, setTenantError] = useState(false);

  useEffect(() => {
    checkAuth();

    // Recarrega config do tenant quando o app volta do background
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') loadTenantConfig();
    });
    return () => sub.remove();
  }, []);

  const loadTenantConfig = async () => {
    if (!TENANT_SUBDOMAIN) {
      setTenantError(true);
      return;
    }
    try {
      const config = await tenantService.getBySubdomain(TENANT_SUBDOMAIN);
      if (config) {
        setTenantId(config.id);
        setTenantConfig(config);
        setTenantError(false);
      } else {
        setTenantError(true);
      }
    } catch {
      setTenantError(true);
    }
  };

  const registerPushToken = async () => {
    try {
      const token = await notificationsService.registerForPushNotifications();
      if (token) await apiService.savePushToken(token);
    } catch (e) {
      console.warn('[Push] Falha ao registrar token:', e);
    }
  };

  const checkAuth = async () => {
    try {
      await loadTenantConfig();
      const token = await apiService.getToken();
      if (token) {
        const profile = await apiService.getProfile();
        setUser(profile);
        registerPushToken();
      }
    } catch {
      await apiService.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const retryTenant = async () => {
    setIsLoading(true);
    setTenantError(false);
    await checkAuth();
  };

  const login = async (data: LoginRequest) => {
    const response = await apiService.login({ ...data, tenantId: tenantId || undefined });
    await apiService.saveToken(response?.token ?? '');
    setUser(response?.user ?? null);
    registerPushToken();
  };

  const register = async (data: RegisterRequest) => {
    if (!tenantId) throw new Error('App não configurado');
    const response = await apiService.register({ ...data, tenantId });
    await apiService.saveToken(response?.token ?? '');
    setUser(response?.user ?? null);
    registerPushToken();
  };

  const logout = async () => {
    await apiService.removeToken();
    setUser(null);
  };

  const refreshUser = async () => {
    try {
      const profile = await apiService.getProfile();
      setUser(profile);
    } catch (error) {
      console.error('Failed to refresh user:', error);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        tenantId,
        tenantConfig,
        tenantError,
        login,
        register,
        logout,
        refreshUser,
        retryTenant,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
