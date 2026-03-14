import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    // Verifica tenant
    if (!dto.tenantId) {
      throw new ConflictException('Tenant ID is required');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant || !tenant.isactive) {
      throw new ConflictException('Invalid or inactive tenant');
    }

    // Verifica se email já existe DENTRO desse tenant
    const existingUser = await this.prisma.user.findUnique({
      where: { 
        email_tenantid: {
          email: dto.email,
          tenantid: dto.tenantId,
        }
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const user = await this.prisma.user.create({
      data: {
        tenantid: dto.tenantId,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        role: 'client',
        addresses: dto.address
          ? {
              create: {
                street: dto.address.street,
                number: dto.address.number,
                complement: dto.address.complement,
                neighborhood: dto.address.neighborhood,
                city: dto.address.city,
                state: dto.address.state,
                zipcode: dto.address.zipcode,
                isdefault: true,
              },
            }
          : undefined,
      },
    });

    const token = this.generateToken(user.id, user.email, user.role, user.tenantid);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantid,
      },
    };
  }

  async login(dto: LoginDto) {
    // Busca usuário pelo email e tenantId
    const user = await this.prisma.user.findUnique({
      where: {
        email_tenantid: {
          email: dto.email,
          tenantid: dto.tenantId ?? null,
        }
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Se o usuário tem tenant, verifica se está ativo
    if (user.tenantid) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: user.tenantid },
      });

      if (!tenant || !tenant.isactive) {
        throw new UnauthorizedException('Tenant is inactive');
      }
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const token = this.generateToken(user.id, user.email, user.role, user.tenantid);

    return {
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone,
        role: user.role,
        tenantId: user.tenantid,
      },
    };
  }

  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
        createdat: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return user;
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const updateData: any = {};

    if (dto.name) updateData.name = dto.name;
    if (dto.phone) updateData.phone = dto.phone;
    if (dto.password) {
      updateData.password = await bcrypt.hash(dto.password, 10);
    }

    const user = await this.prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        role: true,
      },
    });

    return user;
  }

  private generateToken(userId: string, email: string, role: string, tenantId: string | null): string {
    const payload = { sub: userId, email, role, tenantid: tenantId };
    return this.jwtService.sign(payload);
  }
}
