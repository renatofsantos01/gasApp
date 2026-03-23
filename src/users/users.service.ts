import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllClients(tenantId: string) {
    const clients = await this.prisma.user.findMany({
      where: { role: 'client', tenantid: tenantId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        createdat: true,
        addresses: {
          select: {
            id: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipcode: true,
            isdefault: true,
          },
        },
        _count: {
          select: { orders: true },
        },
      },
      orderBy: { createdat: 'desc' },
    });

    return clients.map((client: any) => ({
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      createdAt: client.createdat,
      addresses: client.addresses,
      _count: client._count,
    }));
  }

  async findClientById(id: string, tenantId: string) {
    const client = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        tenantid: true,
        createdat: true,
        addresses: {
          select: {
            id: true,
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipcode: true,
            isdefault: true,
          },
        },
        orders: {
          select: {
            id: true,
            totalamount: true,
            status: true,
            createdat: true,
          },
          orderBy: { createdat: 'desc' },
        },
      },
    });

    if (!client) {
      throw new NotFoundException('Client not found');
    }

    if (client.role !== 'client' || client.tenantid !== tenantId) {
      throw new BadRequestException('User is not a client');
    }

    return {
      id: client.id,
      name: client.name,
      email: client.email,
      phone: client.phone,
      createdAt: client.createdat,
      addresses: client.addresses,
      orders: client.orders.map((order: any) => ({
        id: order.id,
        totalAmount: order.totalamount,
        status: order.status,
        createdAt: order.createdat,
      })),
    };
  }

  async findAllDeliverers(tenantId: string) {
    return this.prisma.user.findMany({
      where: { role: 'entregador', tenantid: tenantId },
      select: { id: true, name: true, email: true, phone: true },
      orderBy: { name: 'asc' },
    });
  }

  async createDeliverer(dto: { name: string; email: string; password: string; phone?: string }, tenantId: string) {
    const existing = await this.prisma.user.findUnique({
      where: { email_tenantid: { email: dto.email, tenantid: tenantId } },
    });
    if (existing) throw new ConflictException('Email já cadastrado');

    const hashed = await bcrypt.hash(dto.password, 10);
    const user = await this.prisma.user.create({
      data: {
        tenantid: tenantId,
        name: dto.name,
        email: dto.email,
        password: hashed,
        phone: dto.phone,
        role: 'entregador',
        phoneverified: true,
      },
    });
    return { id: user.id, name: user.name, email: user.email, phone: user.phone };
  }

  async updateDeliverer(id: string, dto: { name?: string; phone?: string; password?: string }, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.tenantid !== tenantId || user.role !== 'entregador') {
      throw new NotFoundException('Entregador não encontrado');
    }
    const data: any = {};
    if (dto.name) data.name = dto.name;
    if (dto.phone !== undefined) data.phone = dto.phone;
    if (dto.password) data.password = await bcrypt.hash(dto.password, 10);

    const updated = await this.prisma.user.update({ where: { id }, data });
    return { id: updated.id, name: updated.name, email: updated.email, phone: updated.phone };
  }

  async deleteDeliverer(id: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user || user.tenantid !== tenantId || user.role !== 'entregador') {
      throw new NotFoundException('Entregador não encontrado');
    }
    await this.prisma.user.delete({ where: { id } });
    return { message: 'Entregador removido' };
  }

  async findUserOrders(userId: string, tenantId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantid: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.tenantid !== tenantId) {
      throw new NotFoundException('User not found');
    }

    const orders = await this.prisma.order.findMany({
      where: { userid: userId, tenantid: tenantId },
      select: {
        id: true,
        totalamount: true,
        status: true,
        createdat: true,
      },
      orderBy: { createdat: 'desc' },
    });

    return orders.map((order: any) => ({
      id: order.id,
      totalAmount: order.totalamount,
      status: order.status,
      createdAt: order.createdat,
    }));
  }
}
