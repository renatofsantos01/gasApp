import { Controller, Get, Post, Put, Delete, Param, Body, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, MinLength } from 'class-validator';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

class CreateDelivererDto {
  @IsString() name: string;
  @IsEmail() email: string;
  @IsString() @MinLength(6) password: string;
  @IsOptional() @IsString() phone?: string;
}

class UpdateDelivererDto {
  @IsOptional() @IsString() name?: string;
  @IsOptional() @IsString() phone?: string;
  @IsOptional() @IsString() @MinLength(6) password?: string;
}

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('deliverers')
  @ApiOperation({ summary: 'Get all deliverers (Admin only)' })
  async findAllDeliverers(@Request() req: any) {
    return this.usersService.findAllDeliverers(req.user.tenantId);
  }

  @Post('deliverers')
  @ApiOperation({ summary: 'Create a deliverer (Admin only)' })
  async createDeliverer(@Request() req: any, @Body() dto: CreateDelivererDto) {
    return this.usersService.createDeliverer(dto, req.user.tenantId);
  }

  @Put('deliverers/:id')
  @ApiOperation({ summary: 'Update a deliverer (Admin only)' })
  async updateDeliverer(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateDelivererDto) {
    return this.usersService.updateDeliverer(id, dto, req.user.tenantId);
  }

  @Delete('deliverers/:id')
  @ApiOperation({ summary: 'Delete a deliverer (Admin only)' })
  async deleteDeliverer(@Request() req: any, @Param('id') id: string) {
    return this.usersService.deleteDeliverer(id, req.user.tenantId);
  }

  @Get('clients')
  @ApiOperation({ summary: 'Get all clients (Admin only)' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findAllClients(@Request() req: any) {
    return this.usersService.findAllClients(req.user.tenantId);
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get client details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Client details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findClientById(@Request() req: any, @Param('id') id: string) {
    return this.usersService.findClientById(id, req.user.tenantId);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get orders of a specific user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findUserOrders(@Request() req: any, @Param('id') id: string) {
    return this.usersService.findUserOrders(id, req.user.tenantId);
  }
}
