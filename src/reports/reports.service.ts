import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async getDashboard(tenantId: string) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    // Today's orders count
    const todayOrders = await this.prisma.order.count({
      where: {
        tenantid: tenantId,
        createdat: {
          gte: today,
          lt: tomorrow,
        },
      },
    });

    // Pending orders count
    const pendingOrders = await this.prisma.order.count({
      where: { tenantid: tenantId, status: 'Pendente' },
    });

    // In progress orders count
    const inProgressOrders = await this.prisma.order.count({
      where: {
        tenantid: tenantId,
        status: {
          in: ['Em Preparo', 'Saiu para Entrega'],
        },
      },
    });

    // Today's revenue (only delivered orders)
    const todayRevenueResult = await this.prisma.order.aggregate({
      where: {
        tenantid: tenantId,
        createdat: {
          gte: today,
          lt: tomorrow,
        },
        status: 'Entregue',
      },
      _sum: {
        totalamount: true,
      },
    });

    // Month revenue (only delivered orders)
    const monthRevenueResult = await this.prisma.order.aggregate({
      where: {
        tenantid: tenantId,
        createdat: {
          gte: startOfMonth,
        },
        status: 'Entregue',
      },
      _sum: {
        totalamount: true,
      },
    });

    // Recent orders with items
    const recentOrders = await this.prisma.order.findMany({
      where: { tenantid: tenantId },
      take: 10,
      orderBy: { createdat: 'desc' },
      include: {
        user: {
          select: {
            name: true,
          },
        },
        items: {
          include: {
            product: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    return {
      todayOrders,
      pendingOrders,
      inProgressOrders,
      todayRevenue: todayRevenueResult._sum.totalamount || 0,
      monthRevenue: monthRevenueResult._sum.totalamount || 0,
      recentOrders: recentOrders.map((order: any) => ({
        id: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        user: order.user,
        totalAmount: order.totalamount,
        status: order.status,
        createdAt: order.createdat,
        items: order.items.map((item: any) => ({
          productName: item.product.name,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal,
        })),
      })),
    };
  }

  async getOrdersReport(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = { tenantid: tenantId };

    if (startDate || endDate) {
      where.createdat = {};
      if (startDate) where.createdat.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdat.lte = end;
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        address: {
          select: {
            city: true,
          },
        },
      },
      orderBy: { createdat: 'desc' },
    });

    const totalOrders = orders.length;

    // Count orders by status
    const ordersByStatus: Record<string, number> = {
      Pendente: 0,
      'Em Preparo': 0,
      'Saiu para Entrega': 0,
      Entregue: 0,
      Cancelado: 0,
    };

    orders.forEach((order: any) => {
      if (ordersByStatus[order.status] !== undefined) {
        ordersByStatus[order.status]++;
      }
    });

    return {
      totalOrders,
      ordersByStatus,
      orders: orders.map((order: any) => ({
        id: order.id,
        orderNumber: order.id.substring(0, 8).toUpperCase(),
        user: order.user,
        city: order.address.city,
        totalAmount: order.totalamount,
        paymentMethod: order.paymentmethod,
        status: order.status,
        createdAt: order.createdat,
      })),
    };
  }

  async getRevenueReport(tenantId: string, startDate?: string, endDate?: string) {
    const where: any = {
      tenantid: tenantId,
      status: 'Entregue', // Only count delivered orders
    };

    if (startDate || endDate) {
      where.createdat = {};
      if (startDate) where.createdat.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.createdat.lte = end;
      }
    }

    const orders = await this.prisma.order.findMany({
      where,
      select: {
        totalamount: true,
        paymentmethod: true,
      },
    });

    const totalRevenue = orders.reduce((sum: any, order: any) => sum + order.totalamount, 0);

    // Revenue by payment method
    const revenueByPaymentMethod: Record<string, number> = {
      Dinheiro: 0,
      Pix: 0,
      'Cartão': 0,
    };

    orders.forEach((order: any) => {
      if (revenueByPaymentMethod[order.paymentmethod] !== undefined) {
        revenueByPaymentMethod[order.paymentmethod] += order.totalamount;
      }
    });

    return {
      totalRevenue,
      revenueByPaymentMethod,
    };
  }

  async getTopProducts(tenantId: string, startDate?: string, endDate?: string, limit: number = 10) {
    const where: any = {
      order: { tenantid: tenantId },
    };

    if (startDate || endDate) {
      where.order.createdat = {};
      if (startDate) where.order.createdat.gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.order.createdat.lte = end;
      }
    }

    const orderItems = await this.prisma.orderitem.findMany({
      where,
      include: {
        product: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
      },
    });

    // Aggregate by product
    const productStats = new Map<string, any>();

    orderItems.forEach((item: any) => {
      const productId = item.productid;
      if (!productStats.has(productId)) {
        productStats.set(productId, {
          productId,
          productName: item.product.name,
          category: item.product.category,
          totalQuantity: 0,
          totalRevenue: 0,
        });
      }

      const stats = productStats.get(productId);
      stats.totalQuantity += item.quantity;
      stats.totalRevenue += item.subtotal;
    });

    // Convert to array, sort by totalQuantity, and limit
    const topProducts = Array.from(productStats.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return topProducts;
  }
}
