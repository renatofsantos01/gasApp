import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';

@Injectable()
export class CouponsService {
  constructor(private prisma: PrismaService) {}

  async create(tenantId: string, dto: CreateCouponDto) {
    const existing = await this.prisma.coupon.findUnique({
      where: {
        code_tenantid: { code: dto.code.toUpperCase(), tenantid: tenantId },
      },
    });
    if (existing) throw new BadRequestException('Código de cupom já existe');

    return this.prisma.coupon.create({
      data: {
        tenantid: tenantId,
        code: dto.code.toUpperCase(),
        discounttype: dto.discountType,
        discountvalue: dto.discountValue,
        maxuses: dto.maxUses ?? null,
        isactive: dto.isActive ?? true,
        expiresat: dto.expiresAt ? new Date(dto.expiresAt) : null,
      },
    });
  }

  async findAll(tenantId: string) {
    return this.prisma.coupon.findMany({
      where: { tenantid: tenantId },
      orderBy: { createdat: 'desc' },
    });
  }

  async findOne(id: string, tenantId: string) {
    const coupon = await this.prisma.coupon.findUnique({ where: { id } });
    if (!coupon || coupon.tenantid !== tenantId)
      throw new NotFoundException('Cupom não encontrado');
    return coupon;
  }

  async update(id: string, tenantId: string, dto: UpdateCouponDto) {
    await this.findOne(id, tenantId);
    const data: any = {};
    if (dto.code !== undefined) data.code = dto.code.toUpperCase();
    if (dto.discountType !== undefined) data.discounttype = dto.discountType;
    if (dto.discountValue !== undefined) data.discountvalue = dto.discountValue;
    if (dto.maxUses !== undefined) data.maxuses = dto.maxUses;
    if (dto.isActive !== undefined) data.isactive = dto.isActive;
    if (dto.expiresAt !== undefined)
      data.expiresat = dto.expiresAt ? new Date(dto.expiresAt) : null;
    return this.prisma.coupon.update({ where: { id }, data });
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId);
    await this.prisma.coupon.delete({ where: { id } });
    return { message: 'Cupom removido' };
  }

  async validate(
    code: string,
    tenantId: string,
    orderTotal: number,
    userId?: string,
  ): Promise<{
    valid: boolean;
    discountAmount: number;
    coupon?: any;
    message?: string;
  }> {
    const coupon = await this.prisma.coupon.findUnique({
      where: {
        code_tenantid: { code: code.toUpperCase(), tenantid: tenantId },
      },
    });

    if (!coupon)
      return { valid: false, discountAmount: 0, message: 'Cupom não encontrado' };
    if (!coupon.isactive)
      return { valid: false, discountAmount: 0, message: 'Cupom inativo' };
    if (coupon.expiresat && new Date() > coupon.expiresat)
      return { valid: false, discountAmount: 0, message: 'Cupom expirado' };
    if (coupon.maxuses !== null && coupon.usedcount >= coupon.maxuses)
      return { valid: false, discountAmount: 0, message: 'Cupom esgotado' };

    if (userId) {
      const alreadyUsed = await this.prisma.coupon_usage.findUnique({
        where: { couponid_userid: { couponid: coupon.id, userid: userId } },
      });
      if (alreadyUsed)
        return { valid: false, discountAmount: 0, message: 'Você já utilizou este cupom' };
    }

    const discountAmount =
      coupon.discounttype === 'percentage'
        ? Math.min((orderTotal * coupon.discountvalue) / 100, orderTotal)
        : Math.min(coupon.discountvalue, orderTotal);

    return {
      valid: true,
      discountAmount: Math.round(discountAmount * 100) / 100,
      coupon,
    };
  }
}
