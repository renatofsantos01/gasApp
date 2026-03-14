import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000';

export interface TenantConfig {
  id: string;
  appName: string;
  logoUrl?: string;
  splashScreenUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  subdomain: string;
}

export const tenantService = {
  async getBySubdomain(subdomain: string): Promise<TenantConfig | null> {
    try {
      const response = await axios.get(`${API_URL}/tenant/subdomain/${subdomain}`);
      
      if (response?.data?.error) {
        return null;
      }
      
      return response?.data as TenantConfig;
    } catch (error: any) {
      console.error('Error fetching tenant:', error);
      return null;
    }
  },

  async getConfig(token: string): Promise<TenantConfig | null> {
    try {
      const response = await axios.get(`${API_URL}/tenant/config`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response?.data?.error) {
        return null;
      }

      return response?.data as TenantConfig;
    } catch (error: any) {
      console.error('Error fetching tenant config:', error);
      return null;
    }
  },
};
