import { Injectable, NotFoundException, BadRequestException, ForbiddenException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { AssignDelivererDto } from './dto/assign-deliverer.dto';
import { DeliveryStatusDto } from './dto/delivery-status.dto';
import { CouponsService } from '../coupons/coupons.service';
import { NotificationsService } from '../notifications/notifications.service';

// Fórmula de Haversine — distância em km entre dois pontos GPS
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  constructor(
    private prisma: PrismaService,
    private couponsService: CouponsService,
    private notificationsService: NotificationsService,
  ) {}

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

    // Verify all products exist, check stock and calculate totals
    let totalAmount = 0;
    const orderItemsData: { productid: string; quantity: number; unitprice: number; subtotal: number }[] = [];

    for (const item of dto.items) {
      const product = await this.prisma.product.findUnique({
        where: { id: item.productId },
      });

      if (!product) {
        throw new NotFoundException(`Produto não encontrado`);
      }

      if (product.stock < item.quantity) {
        if (product.stock === 0) {
          throw new BadRequestException(`"${product.name}" está esgotado`);
        }
        throw new BadRequestException(
          `"${product.name}" tem apenas ${product.stock} unidade(s) disponível(is)`,
        );
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

    // Apply coupon if provided
    let discountAmount = 0;
    let appliedCouponCode: string | undefined;
    let appliedCoupon: any = null;

    if (dto.couponCode) {
      const validation = await this.couponsService.validate(
        dto.couponCode,
        user.tenantid,
        totalAmount,
      );
      if (!validation.valid) {
        throw new BadRequestException(validation.message ?? 'Cupom inválido');
      }
      discountAmount = validation.discountAmount;
      appliedCouponCode = validation.coupon.code;
      appliedCoupon = validation.coupon;
    }

    const finalAmount = Math.max(0, Math.round((totalAmount - discountAmount) * 100) / 100);

    // Create order + decrement stock atomically
    const [order] = await this.prisma.$transaction([
      this.prisma.order.create({
        data: {
          tenantid: user.tenantid,
          userid: userId,
          addressid: dto.addressId,
          totalamount: finalAmount,
          paymentmethod: dto.paymentMethod,
          status: 'Pendente',
          observations: dto.observations,
          couponcode: appliedCouponCode ?? null,
          discountamount: discountAmount > 0 ? discountAmount : null,
          cpfcnpj: dto.cpfCnpj ?? null,
          items: {
            create: orderItemsData,
          },
        },
        include: {
          items: {
            include: {
              product: {
                select: { name: true, price: true },
              },
            },
          },
        },
      }),
      // Decrement stock for each item
      ...orderItemsData.map((item) =>
        this.prisma.product.update({
          where: { id: item.productid },
          data: { stock: { decrement: item.quantity } },
        }),
      ),
    ]);

    // Increment coupon usage count
    if (appliedCoupon) {
      await this.prisma.coupon.update({
        where: { id: appliedCoupon.id },
        data: { usedcount: { increment: 1 } },
      });
    }

    // Auto-atribuição ao entregador disponível mais próximo
    try {
      const deliverers = await this.prisma.user.findMany({
        where: {
          tenantid: user.tenantid,
          role: 'entregador',
          available: true,
          latitude: { not: null },
          longitude: { not: null },
        },
        select: { id: true, pushtoken: true, latitude: true, longitude: true, name: true },
      });

      if (deliverers.length > 0) {
        // Buscar coordenadas do endereço do pedido via ViaCEP + nominatim (aproximação por CEP)
        // Usamos lat/lng do próprio endereço se disponível, senão tentamos geocodificar
        const orderAddress = await this.prisma.address.findUnique({
          where: { id: dto.addressId },
          select: { zipcode: true },
        });

        let orderLat: number | null = null;
        let orderLon: number | null = null;

        if (orderAddress?.zipcode) {
          try {
            const cleanCep = orderAddress.zipcode.replace(/\D/g, '');
            const geoRes = await fetch(
              `https://nominatim.openstreetmap.org/search?postalcode=${cleanCep}&country=BR&format=json&limit=1`,
              { headers: { 'User-Agent': 'GasApp/1.0' } },
            );
            const geoData = await geoRes.json();
            if (geoData?.[0]) {
              orderLat = parseFloat(geoData[0].lat);
              orderLon = parseFloat(geoData[0].lon);
            }
          } catch (e) {
            this.logger.warn('[AutoAssign] Falha ao geocodificar CEP:', e);
          }
        }

        let nearestDeliverer = deliverers[0];

        if (orderLat !== null && orderLon !== null) {
          let minDist = Infinity;
          for (const d of deliverers) {
            const dist = haversineKm(d.latitude!, d.longitude!, orderLat, orderLon);
            if (dist < minDist) {
              minDist = dist;
              nearestDeliverer = d;
            }
          }
          this.logger.log(`[AutoAssign] Entregador mais próximo: ${nearestDeliverer.name} (${minDist.toFixed(1)} km)`);
        }

        await this.prisma.order.update({
          where: { id: order.id },
          data: { delivererid: nearestDeliverer.id },
        });

        if (nearestDeliverer.pushtoken) {
          await this.notificationsService.sendPushNotification(
            [nearestDeliverer.pushtoken],
            'Nova Entrega!',
            `Pedido #${order.id.substring(0, 8).toUpperCase()} foi atribuído a você`,
            { orderId: order.id, screen: 'DelivererHome' },
          );
        }
      }
    } catch (e) {
      this.logger.warn('[AutoAssign] Falha na auto-atribuição:', e);
    }

    // Notificar admins do tenant sobre novo pedido
    try {
      const admins = await this.prisma.user.findMany({
        where: { tenantid: user.tenantid, role: 'admin', pushtoken: { not: null } },
        select: { pushtoken: true },
      });
      const tokens = admins.map((a) => a.pushtoken!);
      await this.notificationsService.sendPushNotification(
        tokens,
        'Novo Pedido!',
        `Pedido #${order.id.substring(0, 8).toUpperCase()} recebido`,
        { orderId: order.id, screen: 'AdminOrders' },
      );
    } catch (_) {}

    return {
      id: order.id,
      userId: order.userid,
      addressId: order.addressid,
      totalAmount: order.totalamount,
      paymentMethod: order.paymentmethod,
      status: order.status,
      observations: order.observations,
      couponCode: order.couponcode,
      discountAmount: order.discountamount,
      cpfCnpj: order.cpfcnpj,
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

  async findAll(userId: string, userRole: string, tenantId: string, page = 1, limit = 50) {
    const safePage = Math.max(1, page);
    const safeLimit = Math.min(100, Math.max(1, limit));
    const skip = (safePage - 1) * safeLimit;

    const where =
      userRole === 'admin' || userRole === 'superadmin'
        ? { tenantid: tenantId }
        : { userid: userId };

    const [total, orders] = await this.prisma.$transaction([
      this.prisma.order.count({ where }),
      this.prisma.order.findMany({
        where,
        skip,
        take: safeLimit,
        include: {
          user: {
            select: { name: true, email: true, phone: true },
          },
          deliverer: {
            select: { id: true, name: true },
          },
          address: {
            select: {
              street: true, number: true, complement: true,
              neighborhood: true, city: true, state: true, zipcode: true,
            },
          },
          items: {
            include: {
              product: { select: { name: true, imageurl: true, price: true } },
            },
          },
        },
        orderBy: { createdat: 'desc' },
      }),
    ]);

    return {
      data: orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      userId: order.userid,
      user: order.user,
      delivererId: order.delivererid,
      delivererName: order.deliverer?.name ?? null,
      address: order.address,
      totalAmount: order.totalamount,
      paymentMethod: order.paymentmethod,
      status: order.status,
      observations: order.observations,
      couponCode: order.couponcode,
      discountAmount: order.discountamount,
      cpfCnpj: order.cpfcnpj,
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
    })),
      pagination: {
        total,
        page: safePage,
        limit: safeLimit,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
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
      couponCode: order.couponcode,
      discountAmount: order.discountamount,
      cpfCnpj: order.cpfcnpj,
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

    // Notificar cliente sobre mudança de status
    try {
      const client = await this.prisma.user.findUnique({
        where: { id: order.userid },
        select: { pushtoken: true },
      });
      if (client?.pushtoken) {
        await this.notificationsService.sendPushNotification(
          [client.pushtoken],
          'Atualização do Pedido',
          `Seu pedido está: ${dto.status}`,
          { orderId: id, screen: 'MyOrders' },
        );
      }
    } catch (_) {}

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

    // Notificar cliente sobre cancelamento
    try {
      const client = await this.prisma.user.findUnique({
        where: { id: order.userid },
        select: { pushtoken: true },
      });
      if (client?.pushtoken) {
        await this.notificationsService.sendPushNotification(
          [client.pushtoken],
          'Pedido Cancelado',
          `Seu pedido #${id.substring(0, 8).toUpperCase()} foi cancelado`,
          { orderId: id, screen: 'MyOrders' },
        );
      }
    } catch (_) {}

    return {
      id: updatedOrder.id,
      status: updatedOrder.status,
      cancelReason: updatedOrder.cancelreason,
      updatedAt: updatedOrder.updatedat,
    };
  }

  async assignDeliverer(orderId: string, dto: AssignDelivererDto, tenantId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.tenantid !== tenantId) throw new ForbiddenException('Not your tenant');

    const deliverer = await this.prisma.user.findUnique({ where: { id: dto.delivererId } });
    if (!deliverer || deliverer.role !== 'entregador' || deliverer.tenantid !== tenantId) {
      throw new BadRequestException('Entregador inválido');
    }

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { delivererid: dto.delivererId },
      select: { id: true, delivererid: true, status: true },
    });

    // Notificar entregador sobre nova entrega atribuída
    try {
      if (deliverer.pushtoken) {
        await this.notificationsService.sendPushNotification(
          [deliverer.pushtoken],
          'Nova Entrega!',
          `Pedido #${orderId.substring(0, 8).toUpperCase()} foi atribuído a você`,
          { orderId, screen: 'DelivererHome' },
        );
      }
    } catch (_) {}

    return { id: updated.id, delivererId: updated.delivererid, status: updated.status };
  }

  async getMyDeliveries(delivererId: string) {
    const orders = await this.prisma.order.findMany({
      where: {
        delivererid: delivererId,
        status: { notIn: ['Cancelado'] },
      },
      include: {
        user: { select: { name: true, phone: true } },
        address: {
          select: {
            street: true, number: true, complement: true,
            neighborhood: true, city: true, state: true, zipcode: true,
          },
        },
        items: {
          include: {
            product: { select: { name: true, price: true, imageurl: true } },
          },
        },
      },
      orderBy: { createdat: 'desc' },
    });

    return orders.map((order: any) => ({
      id: order.id,
      orderNumber: order.id.substring(0, 8).toUpperCase(),
      status: order.status,
      totalAmount: order.totalamount,
      paymentMethod: order.paymentmethod,
      observations: order.observations,
      createdAt: order.createdat,
      user: order.user,
      address: order.address,
      items: order.items.map((item: any) => ({
        quantity: item.quantity,
        unitPrice: item.unitprice,
        subtotal: item.subtotal,
        product: {
          name: item.product.name,
          price: item.product.price,
          imageUrl: item.product.imageurl,
        },
      })),
    }));
  }

  async updateDeliveryStatus(orderId: string, dto: DeliveryStatusDto, delivererId: string) {
    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order) throw new NotFoundException('Order not found');
    if (order.delivererid !== delivererId) throw new ForbiddenException('Not your delivery');

    const updated = await this.prisma.order.update({
      where: { id: orderId },
      data: { status: dto.status },
      select: { id: true, status: true, updatedat: true },
    });

    // Notificar cliente sobre atualização do entregador
    try {
      const client = await this.prisma.user.findUnique({
        where: { id: order.userid },
        select: { pushtoken: true },
      });
      if (client?.pushtoken) {
        await this.notificationsService.sendPushNotification(
          [client.pushtoken],
          'Atualização do Pedido',
          `Seu pedido está: ${dto.status}`,
          { orderId, screen: 'MyOrders' },
        );
      }
    } catch (_) {}

    return { id: updated.id, status: updated.status, updatedAt: updated.updatedat };
  }
}
