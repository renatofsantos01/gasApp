import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, dto: CreateOrderDto) {
    // Get user's tenant
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { tenantid: true },
    });

    if (!user || !user.tenantid) {
      throw new ForbiddenException('User has no tenant');
    }

    // Verify address belongs to user
    const address = await this.prisma.address.findUnique({
      where: { id: dto.addressId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userid !== userId) {
      throw new ForbiddenException('Address does not belong to you');
    }

    // Verify all products exist and calculate totals
    let totalAmount = 0;
    const orderItemsData: { productid: string; quantity: number; unitprice: number; subtotal: number }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Product ${item.productId} not found`);
      }

      const subtotal = product.price * item.quantity;
      totalAmount += subtotal;

      orderItemsData.push({
        productid: item.productId,
        quantity: item.quantity,
        unitprice: product.price,
        subtotal,
      });
    }

    // Create order with items
    const order = await this.prisma.order.create({
      data: {
        tenantid: user.tenantid,
        userid: userId,
        addressid: dto.addressId,
        totalamount: totalAmount,
        paymentmethod: dto.paymentMethod,
        status: 'Pendente',
        observations: dto.observations,
        items: {
          create: orderItemsData,
        },
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
              },
            },
          },
        },
      },
    });

    return {
      id: order.id,
      userId: order.userid,
      addressId: order.addressid,
      totalAmount: order.totalamount,
      paymentMethod: order.paymentmethod,
      status: order.status,
      observations: order.observations,
      createdAt: order.createdat,
      items: order.items.map((item: any) => ({
        id: item.id,
        productId: item.productid,
        product: item.product,
        quantity: item.quantity,
        unitPrice: item.unitprice,
        subtotal: item.subtotal,
      })),
    };
  }

  async findAll(userId: string, userRole: string, tenantId: string) {
    const where = userRole === 'admin' ? { tenantid: tenantId } : { userid: userId };

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        address: {
          select: {
            street: true,
            number: true,
            complement: true,
            neighborhood: true,
            city: true,
            state: true,
            zipcode: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageurl: true,
                price: true,
              },
            },
          },
        },
      },
      orderBy: { createdat: 'desc' },
    });

    return orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      userId: order.userid,
      user: order.user,
      address: order.address,
      totalAmount: order.totalamount,
      paymentMethod: order.paymentmethod,
      status: order.status,
      observations: order.observations,
      createdAt: order.createdat,
      items: order.items.map((item: any) => ({
        product: {
          name: item.product.name,
          imageUrl: item.product.imageurl,
          price: item.product.price,
        },
        quantity: item.quantity,
        price: item.unitprice,
        subtotal: item.subtotal,
      })),
    }));
  }

  async findOne(id: string, userId: string, userRole: string) {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            phone: true,
          },
        },
        address: true,
        items: {
          include: {
            product: {
              select: {
                name: true,
                imageurl: true,
                price: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    // Client can only view their own orders
    if (userRole !== 'admin' && order.userid !== userId) {
      throw new ForbiddenException('You can only view your own orders');
    }

    return {
      id: order.id,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      userId: order.userid,
      user: order.user,
      address: {
        street: order.address.street,
        number: order.address.number,
        complement: order.address.complement,
        neighborhood: order.address.neighborhood,
        city: order.address.city,
        state: order.address.state,
        zipcode: order.address.zipcode,
      },
      totalAmount: order.totalamount,
      paymentMethod: order.paymentmethod,
      status: order.status,
      observations: order.observations,
      cancelReason: order.cancelreason,
      createdAt: order.createdat,
      updatedAt: order.updatedat,
      items: order.items.map((item: any) => ({
        id: item.id,
        product: {
          name: item.product.name,
          imageUrl: item.product.imageurl,
          price: item.product.price,
        },
        quantity: item.quantity,
        price: item.unitprice, // Map unitprice to price for frontend compatibility
        unitPrice: item.unitprice,
        subtotal: item.subtotal,
      })),
    };
  }

  async updateStatus(id: string, dto: UpdateOrderStatusDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        status: true,
        updatedat: true,
      },
    });

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      updatedAt: updatedOrder.updatedat,
    };
  }

  async cancel(id: string, dto: CancelOrderDto) {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data: {
        status: 'Cancelado',
        cancelreason: dto.cancelReason,
      },
      select: {
        id: true,
        status: true,
        cancelreason: true,
        updatedat: true,
      },
    });

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      cancelReason: updatedOrder.cancelreason,
      updatedAt: updatedOrder.updatedat,
    };
  }
}
