import {
  Controller, Get, Post, Put, Patch, Delete,
  Param, Body, UseGuards, Req, NotFoundException, ForbiddenException,
} from '@nestjs/common';
import { TenantService } from './tenant.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SuperAdminGuard } from '../auth/guards/superadmin.guard';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';

@Controller('tenant')
export class TenantController {
  constructor(private tenantService: TenantService) {}

  // ─── Rotas públicas ────────────────────────────────────────────────────────

  @Get('subdomain/:subdomain')
  async getBySubdomain(@Param('subdomain') subdomain: string) {
    const tenant = await this.tenantService.findBySubdomain(subdomain);
    if (!tenant || !tenant.isactive) throw new NotFoundException('Tenant not found');
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
    if (!tenantId) throw new ForbiddenException('No tenant associated with user');
    const config = await this.tenantService.getConfig(tenantId);
    if (!config) throw new NotFoundException('Tenant not found');
    return config;
  }

  // ─── Rotas de gerenciamento (somente superadmin) ───────────────────────────

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get()
  findAll() {
    return this.tenantService.findAll();
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    const tenant = await this.tenantService.findById(id);
    if (!tenant) throw new NotFoundException('Tenant not found');
    return tenant;
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Post()
  create(@Body() dto: CreateTenantDto) {
    return this.tenantService.create(dto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTenantDto) {
    return this.tenantService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Patch(':id/toggle-active')
  toggleActive(@Param('id') id: string) {
    return this.tenantService.toggleActive(id);
  }

  @UseGuards(JwtAuthGuard, SuperAdminGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.tenantService.remove(id);
  }
}
