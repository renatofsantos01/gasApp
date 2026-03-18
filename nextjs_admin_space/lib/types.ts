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
