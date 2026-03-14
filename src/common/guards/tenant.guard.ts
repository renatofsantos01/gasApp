import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      throw new ForbiddenException('User not authenticated');
    }

    // SuperAdmin pode acessar tudo
    if (user.role === 'superadmin') {
      return true;
    }

    // Usuários normais precisam ter tenantId
    if (!user.tenantid) {
      throw new ForbiddenException('User does not belong to any tenant');
    }

    // Injeta tenantId no request para uso nos controllers
    request.tenantId = user.tenantid;

    return true;
  }
}
