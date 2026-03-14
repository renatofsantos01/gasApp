import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantService {
  constructor(private prisma: PrismaService) {}

  async findBySubdomain(subdomain: string) {
    return this.prisma.tenant.findUnique({
      where: { subdomain },
    });
  }

  async findById(id: string) {
    return this.prisma.tenant.findUnique({
      where: { id },
    });
  }

  async findAll() {
    return this.prisma.tenant.findMany({
      orderBy: { createdat: 'desc' },
    });
  }

  async getConfig(tenantId: string) {
    const tenant = await this.findById(tenantId);
    if (!tenant) {
      return null;
    }

    return {
      appName: tenant.appname,
      logoUrl: tenant.logourl,
      splashScreenUrl: tenant.splashscreenurl,
      primaryColor: tenant.primarycolor,
      secondaryColor: tenant.secondarycolor,
      subdomain: tenant.subdomain,
    };
  }
}
