import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateTenantDto } from './dto/update-tenant.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findBySubdomain(subdomain: string) {
    return this.prisma.tenant.findUnique({ where: { subdomain } });
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({ where: { id } });
  }

  async findAll() {
    return this.prisma.tenant.findMany({ orderBy: { createdat: 'desc' } });
  }

  async create(dto: CreateTenantDto) {
    try {
      return await this.prisma.tenant.create({
        data: {
          companyname: dto.companyname,
          appname: dto.appname,
          subdomain: dto.subdomain,
          email: dto.email,
          phone: dto.phone,
          primarycolor: dto.primarycolor ?? '#FF5722',
          secondarycolor: dto.secondarycolor ?? '#2196F3',
          logourl: dto.logourl,
          splashscreenurl: dto.splashscreenurl,
          isactive: dto.isactive ?? true,
        },
      });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`Subdomain "${dto.subdomain}" already in use`);
      }
      throw err;
    }
  }

  async update(id: string, dto: UpdateTenantDto) {
    await this.ensureExists(id);
    try {
      return await this.prisma.tenant.update({ where: { id }, data: dto });
    } catch (err) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        throw new ConflictException(`Subdomain "${dto.subdomain}" already in use`);
      }
      throw err;
    }
  }

  async toggleActive(id: string) {
    const tenant = await this.ensureExists(id);
    return this.prisma.tenant.update({
      where: { id },
      data: { isactive: !tenant.isactive },
    });
  }

  async remove(id: string) {
    await this.ensureExists(id);
    return this.prisma.tenant.delete({ where: { id } });
  }

  async getConfig(tenantId: string) {
    const tenant = await this.findById(tenantId);
    if (!tenant) return null;
    return {
      appName: tenant.appname,
      logoUrl: tenant.logourl,
      splashScreenUrl: tenant.splashscreenurl,
      primaryColor: tenant.primarycolor,
      secondaryColor: tenant.secondarycolor,
      subdomain: tenant.subdomain,
    };
  }

  private async ensureExists(id: string) {
    const tenant = await this.findById(id);
    if (!tenant) throw new NotFoundException(`Tenant ${id} not found`);
    return tenant;
  }
}
