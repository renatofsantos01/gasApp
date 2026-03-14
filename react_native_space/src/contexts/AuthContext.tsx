import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { apiService } from '../services/api';
import { User, LoginRequest, RegisterRequest } from '../types';
import { TenantConfig } from '../services/tenantService';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  tenantId: string | null;
  tenantConfig: TenantConfig | null;
  login: (data: LoginRequest) => Promise<void>;
  register: (data: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [tenantId, setTenantId] = useState<string | null>(null);
  const [tenantConfig, setTenantConfig] = useState<TenantConfig | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  const loadTenantConfig = async () => {
    try {
      const savedTenantId = await AsyncStorage.getItem('tenantId');
      const savedConfig = await AsyncStorage.getItem('tenantConfig');
      
      if (savedTenantId) {
        setTenantId(savedTenantId);
      }
      
      if (savedConfig) {
        setTenantConfig(JSON.parse(savedConfig));
      }
    } catch (error) {
      console.error('Error loading tenant config:', error);
    }
  };

  const checkAuth = async () => {
    try {
      await loadTenantConfig();
      
      const token = await apiService.getToken();
      if (token) {
        const profile = await apiService.getProfile();
        setUser(profile);
      }
    } catch (error) {
      await apiService.removeToken();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (data: LoginRequest) => {
    // Adiciona tenantId do storage ao request
    const savedTenantId = await AsyncStorage.getItem('tenantId');
    const loginData = {
      ...data,
      tenantId: savedTenantId || undefined,
    };
    
    const response = await apiService.login(loginData);
    await apiService.saveToken(response?.token ?? '');
    setUser(response?.user ?? null);
  };

  const register = async (data: RegisterRequest) => {
    // Adiciona tenantId do storage ao request
    const savedTenantId = await AsyncStorage.getItem('tenantId');
    if (!savedTenantId) {
      throw new Error('Tenant not selected');
    }
    
    const registerData = {
      ...data,
      tenantId: savedTenantId,
    };
    
    const response = await apiService.register(registerData);
    await apiService.saveToken(response?.token ?? '');
    setUser(response?.user ?? null);
  };

  const logout = async () => {
    await apiService.removeToken();
    // Remove tenant config ao fazer logout
    await AsyncStorage.removeItem('tenantId');
    await AsyncStorage.removeItem('tenantConfig');
    setUser(null);
    setTenantId(null);
    setTenantConfig(null);
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
        login,
        register,
        logout,
        refreshUser,
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
