import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string) {
    return this.prisma.address.findMany({
      where: { userid: userId },
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
    });
  }

  async create(userId: string, dto: CreateAddressDto) {
    // If this address is set as default, unset other default addresses
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userid: userId, isdefault: true },
        data: { isdefault: false },
      });
    }

    return this.prisma.address.create({
      data: {
        userid: userId,
        street: dto.street,
        number: dto.number,
        complement: dto.complement,
        neighborhood: dto.neighborhood,
        city: dto.city,
        state: dto.state,
        zipcode: dto.zipcode,
        isdefault: dto.isDefault || false,
      },
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
    });
  }

  async update(userId: string, id: string, dto: UpdateAddressDto) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userid !== userId) {
      throw new ForbiddenException('You can only update your own addresses');
    }

    // If this address is set as default, unset other default addresses
    if (dto.isDefault) {
      await this.prisma.address.updateMany({
        where: { userid: userId, isdefault: true, id: { not: id } },
        data: { isdefault: false },
      });
    }

    const updateData: any = {};
    if (dto.street !== undefined) updateData.street = dto.street;
    if (dto.number !== undefined) updateData.number = dto.number;
    if (dto.complement !== undefined) updateData.complement = dto.complement;
    if (dto.neighborhood !== undefined) updateData.neighborhood = dto.neighborhood;
    if (dto.city !== undefined) updateData.city = dto.city;
    if (dto.state !== undefined) updateData.state = dto.state;
    if (dto.zipcode !== undefined) updateData.zipcode = dto.zipcode;
    if (dto.isDefault !== undefined) updateData.isdefault = dto.isDefault;

    return this.prisma.address.update({
      where: { id },
      data: updateData,
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
    });
  }

  async remove(userId: string, id: string) {
    const address = await this.prisma.address.findUnique({
      where: { id },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    if (address.userid !== userId) {
      throw new ForbiddenException('You can only delete your own addresses');
    }

    await this.prisma.address.delete({
      where: { id },
    });

    return { message: 'Address deleted successfully' };
  }
}
