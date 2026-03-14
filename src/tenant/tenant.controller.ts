import { Controller, Get, Param, UseGuards, Req } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('subdomain/:subdomain')
  async getBySubdomain(@Param('subdomain') subdomain: string) {
    const tenant = await this.tenantService.findBySubdomain(subdomain);
    if (!tenant) {
      return { error: 'Tenant not found' };
    }
    return {
      id: tenant.id,
      appName: tenant.appname,
      logoUrl: tenant.logourl,
      splashScreenUrl: tenant.splashscreenurl,
      primaryColor: tenant.primarycolor,
      secondaryColor: tenant.secondarycolor,
      subdomain: tenant.subdomain,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Get('config')
  async getConfig(@Req() req: any) {
    const tenantId = req.user?.tenantid;
    if (!tenantId) {
      return { error: 'No tenant associated with user' };
    }
    return this.tenantService.getConfig(tenantId);
  }
}
