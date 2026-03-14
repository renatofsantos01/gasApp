import { Controller, Get, Post, Put, Delete, Body, Param, UseGuards, Request } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiResponse } from '@nestjs/swagger';
import { AddressesService } from './addresses.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@ApiTags('Addresses')
@Controller('addresses')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class AddressesController {
  constructor(private addressesService: AddressesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all addresses of logged user' })
  @ApiResponse({ status: 200, description: 'Addresses retrieved successfully' })
  async findAll(@Request() req: any) {
    return this.addressesService.findAll(req.user.userId);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new address' })
  @ApiResponse({ status: 201, description: 'Address created successfully' })
  async create(@Request() req: any, @Body() dto: CreateAddressDto) {
    return this.addressesService.create(req.user.userId, dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an address' })
  @ApiResponse({ status: 200, description: 'Address updated successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only update own addresses' })
  async update(@Request() req: any, @Param('id') id: string, @Body() dto: UpdateAddressDto) {
    return this.addressesService.update(req.user.userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an address' })
  @ApiResponse({ status: 200, description: 'Address deleted successfully' })
  @ApiResponse({ status: 404, description: 'Address not found' })
  @ApiResponse({ status: 403, description: 'Forbidden - Can only delete own addresses' })
  async remove(@Request() req: any, @Param('id') id: string) {
    return this.addressesService.remove(req.user.userId, id);
  }
}
