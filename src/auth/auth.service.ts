import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.tenantId) {
      throw new ConflictException('Tenant ID is required');
    }

    const tenant = await this.prisma.tenant.findUnique({
      where: { id: dto.tenantId },
    });

    if (!tenant || !tenant.isactive) {
      throw new ConflictException('Invalid or inactive tenant');
    }

    const existingUser = await this.prisma.user.findUnique({
      where: {
        email_tenantid: {
          email: dto.email,
          tenantid: dto.tenantId,
        },
      },
    });

    if (existingUser) {
      throw new ConflictException('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Novo usuário com phone começa não verificado
    const phoneVerified = !dto.phone;

    const user = await this.prisma.user.create({
      data: {
        tenantid: dto.tenantId,
        name: dto.name,
        email: dto.email,
        password: hashedPassword,
        phone: dto.phone,
        phoneverified: phoneVerified,
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
        phoneVerified: user.phoneverified,
      },
    };
  }

  async login(dto: LoginDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        tenantid: dto.tenantId ?? null,
      },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

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
        phoneVerified: user.phoneverified,
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
        phoneverified: true,
        createdat: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    return { ...user, phoneVerified: user.phoneverified };
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
        phoneverified: true,
      },
    });

    return { ...user, phoneVerified: user.phoneverified };
  }

  async sendPhoneVerification(userId: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    if (!user.phone) throw new BadRequestException('Nenhum telefone cadastrado');
    if (user.phoneverified) throw new ConflictException('Telefone já verificado');

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresat = new Date(Date.now() + 10 * 60 * 1000); // 10 minutos

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneverificationcode: code,
        phoneverificationexpiresat: expiresat,
      },
    });

    await this.smsService.sendSms(
      user.phone,
      `Seu código de verificação é: ${code}. Válido por 10 minutos.`,
    );

    return { message: 'Código enviado com sucesso' };
  }

  async verifyPhone(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    if (user.phoneverified) return { message: 'Telefone já verificado' };

    if (!user.phoneverificationcode || user.phoneverificationcode !== code) {
      throw new BadRequestException('Código inválido');
    }

    if (user.phoneverificationexpiresat && user.phoneverificationexpiresat < new Date()) {
      throw new BadRequestException('Código expirado. Solicite um novo código.');
    }

    await this.prisma.user.update({
      where: { id: userId },
      data: {
        phoneverified: true,
        phoneverificationcode: null,
        phoneverificationexpiresat: null,
      },
    });

    return { message: 'Telefone verificado com sucesso' };
  }

  private generateToken(userId: string, email: string, role: string, tenantId: string | null): string {
    const payload = { sub: userId, email, role, tenantid: tenantId };
    return this.jwtService.sign(payload);
  }
}
