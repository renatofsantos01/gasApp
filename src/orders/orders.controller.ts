import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards, Request, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { CancelOrderDto } from './dto/cancel-order.dto';
import { AssignDelivererDto } from './dto/assign-deliverer.dto';
import { DeliveryStatusDto } from './dto/delivery-status.dto';
import { CreateActivityDto } from './dto/create-activity.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Orders')
@Controller('orders')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrdersController {
  constructor(private ordersService: OrdersService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 404, description: 'Address or product not found' })
  async create(@Request() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.create(req.user.userId, dto);
  }

  @Get('my-deliveries')
  @ApiOperation({ summary: 'Get orders assigned to me (Entregador only)' })
  async getMyDeliveries(@Request() req: any) {
    if (req.user.role !== 'entregador') throw new ForbiddenException('Entregadores apenas');
    return this.ordersService.getMyDeliveries(req.user.userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get orders (client: own orders, admin: all orders)' })
  @ApiResponse({ status: 200, description: 'Orders retrieved successfully' })
  async findAll(
    @Request() req: any,
    @Query('page') page = '1',
    @Query('limit') limit = '50',
  ) {
    return this.ordersService.findAll(
      req.user.userId,
      req.user.role,
      req.user.tenantId,
      parseInt(page, 10),
      parseInt(limit, 10),
    );
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order details by ID' })
  @ApiResponse({ status: 200, description: 'Order retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only view own orders' })
  async findOne(@Request() req: any, @Param('id') id: string) {
    return this.ordersService.findOne(id, req.user.userId, req.user.role);
  }

  @Patch(':id/status')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Update order status (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order status updated successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.ordersService.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Cancel order (Admin only)' })
  @ApiResponse({ status: 200, description: 'Order cancelled successfully' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async cancel(@Param('id') id: string, @Body() dto: CancelOrderDto) {
    return this.ordersService.cancel(id, dto);
  }

  @Patch(':id/assign')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Assign deliverer to order (Admin only)' })
  async assignDeliverer(@Param('id') id: string, @Body() dto: AssignDelivererDto, @Request() req: any) {
    return this.ordersService.assignDeliverer(id, dto, req.user.tenantId);
  }

  @Patch(':id/delivery-status')
  @ApiOperation({ summary: 'Update delivery status (Entregador only)' })
  async updateDeliveryStatus(@Param('id') id: string, @Body() dto: DeliveryStatusDto, @Request() req: any) {
    if (req.user.role !== 'entregador') throw new ForbiddenException('Entregadores apenas');
    return this.ordersService.updateDeliveryStatus(id, dto, req.user.userId);
  }

  @Get(':id/activities')
  @ApiOperation({ summary: 'Get order activity feed' })
  async getActivities(@Param('id') id: string, @Request() req: any) {
    return this.ordersService.getActivities(id, req.user.userId, req.user.role);
  }

  @Post(':id/activities')
  @ApiOperation({ summary: 'Add observation to order activity feed' })
  async addActivity(@Param('id') id: string, @Body() dto: CreateActivityDto, @Request() req: any) {
    return this.ordersService.addActivity(id, dto.content, req.user.userId, req.user.role);
  }
}
