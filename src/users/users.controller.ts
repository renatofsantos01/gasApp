import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Users')
@Controller('users')
@UseGuards(JwtAuthGuard, AdminGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('clients')
  @ApiOperation({ summary: 'Get all clients (Admin only)' })
  @ApiResponse({ status: 200, description: 'Clients retrieved successfully' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findAllClients() {
    return this.usersService.findAllClients();
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Get client details by ID (Admin only)' })
  @ApiResponse({ status: 200, description: 'Client details retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Client not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findClientById(@Param('id') id: string) {
    return this.usersService.findClientById(id);
  }

  @Get(':id/orders')
  @ApiOperation({ summary: 'Get orders of a specific user (Admin only)' })
  @ApiResponse({ status: 200, description: 'User orders retrieved successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async findUserOrders(@Param('id') id: string) {
    return this.usersService.findUserOrders(id);
  }
}
