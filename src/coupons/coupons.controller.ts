import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CouponsService } from './coupons.service';
import { CreateCouponDto } from './dto/create-coupon.dto';
import { UpdateCouponDto } from './dto/update-coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('Coupons')
@Controller('coupons')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CouponsController {
  constructor(private couponsService: CouponsService) {}

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Criar cupom (admin)' })
  create(@Request() req: any, @Body() dto: CreateCouponDto) {
    return this.couponsService.create(req.user.tenantId, dto);
  }

  @Get()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Listar cupons (admin)' })
  findAll(@Request() req: any) {
    return this.couponsService.findAll(req.user.tenantId);
  }

  @Put(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Atualizar cupom (admin)' })
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCouponDto,
  ) {
    return this.couponsService.update(id, req.user.tenantId, dto);
  }

  @Delete(':id')
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Remover cupom (admin)' })
  remove(@Request() req: any, @Param('id') id: string) {
    return this.couponsService.remove(id, req.user.tenantId);
  }

  @Get('validate/:code')
  @ApiOperation({ summary: 'Validar cupom (cliente)' })
  async validate(
    @Request() req: any,
    @Param('code') code: string,
    @Query('total') total: string,
  ) {
    return this.couponsService.validate(
      code,
      req.user.tenantId,
      parseFloat(total) || 0,
    );
  }
}
