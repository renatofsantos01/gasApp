import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private mapProduct(p: any) {
    return {
      id: p.id,
      name: p.name,
      category: p.category,
      description: p.description,
      price: p.price,
      imageUrl: p.imageurl,
      stock: p.stock,
      createdat: p.createdat,
    };
  }

  async findAll(tenantId: string, category?: string) {
    const where: any = { tenantid: tenantId };
    if (category) where.category = category;

    const products = await this.prisma.product.findMany({
      where,
      orderBy: { createdat: 'desc' },
    });
    return products.map((p) => this.mapProduct(p));
  }

  async findOne(id: string, tenantId: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    if (product.tenantid !== tenantId) {
      throw new ForbiddenException('Access denied');
    }

    return this.mapProduct(product);
  }

  async create(dto: CreateProductDto, tenantId: string) {
    const product = await this.prisma.product.create({
      data: {
        name: dto.name,
        category: dto.category,
        description: dto.description,
        price: dto.price,
        imageurl: dto.imageUrl,
        stock: dto.stock,
        tenantid: tenantId,
      },
    });
    return this.mapProduct(product);
  }

  async update(id: string, dto: UpdateProductDto, tenantId: string) {
    await this.findOne(id, tenantId);

    const updateData: any = {};
    if (dto.name !== undefined) updateData.name = dto.name;
    if (dto.category !== undefined) updateData.category = dto.category;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.price !== undefined) updateData.price = dto.price;
    if (dto.imageUrl !== undefined) updateData.imageurl = dto.imageUrl;
    if (dto.stock !== undefined) updateData.stock = dto.stock;

    const product = await this.prisma.product.update({
      where: { id },
      data: updateData,
    });
    return this.mapProduct(product);
  }

  async remove(id: string, tenantId: string) {
    await this.findOne(id, tenantId); // Check if exists and belongs to tenant

    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }
}
