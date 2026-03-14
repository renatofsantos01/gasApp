import { Controller, Get, Param, UseGuards, Req, NotFoundException, ForbiddenException } from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  @Get('subdomain/:subdomain')
  async getBySubdomain(@Param('subdomain') subdomain: string) {
    const tenant = await this.tenantService.findBySubdomain(subdomain);
    if (!tenant) {
      throw new NotFoundException('Tenant not found');
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
    const tenantId = req.user?.tenantId;
    if (!tenantId) {
      throw new ForbiddenException('No tenant associated with user');
    }
    const config = await this.tenantService.getConfig(tenantId);
    if (!config) {
      throw new NotFoundException('Tenant not found');
    }
    return config;
  }
}
