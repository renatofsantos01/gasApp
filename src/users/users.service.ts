import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAllClients() {
    const clients = await this.prisma.user.findMany({
      where: { role: 'client' },
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

  async findClientById(id: string) {
    const client = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
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

    if (client.role !== 'client') {
      throw new NotFoundException('User is not a client');
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

  async findUserOrders(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orders = await this.prisma.order.findMany({
      where: { userid: userId },
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
