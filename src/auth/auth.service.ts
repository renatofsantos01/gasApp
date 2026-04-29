import { Injectable, UnauthorizedException, ConflictException, BadRequestException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { SmsService } from '../sms/sms.service';
import { MailService } from '../mail/mail.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private smsService: SmsService,
    private mailService: MailService,
  ) {}

  async register(dto: RegisterDto) {
    if (!dto.tenantId) {
      throw new ConflictException('Tenant ID is required');
    }

    if (!dto.lgpdAccepted) {
      throw new BadRequestException('É necessário aceitar os termos de tratamento de dados');
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
      throw new ConflictException('Este e-mail já está cadastrado');
    }

    if (dto.phone) {
      const existingPhone = await this.prisma.user.findFirst({
        where: { phone: dto.phone, tenantid: dto.tenantId },
      });
      if (existingPhone) {
        throw new ConflictException('Este telefone já está cadastrado');
      }
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
        lgpdacceptedat: new Date(),
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

    await this.smsService.sendVerification(user.phone);

    return { message: 'Código enviado com sucesso' };
  }

  async verifyPhone(userId: string, code: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user) throw new UnauthorizedException('Usuário não encontrado');
    if (user.phoneverified) return { message: 'Telefone já verificado' };
    if (!user.phone) throw new BadRequestException('Nenhum telefone cadastrado');

    const approved = await this.smsService.checkVerification(user.phone, code);
    if (!approved) throw new BadRequestException('Código inválido ou expirado');

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

  async savePushToken(userId: string, token: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushtoken: token },
    });
    return { message: 'Token salvo' };
  }

  async logout(userId: string): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { pushtoken: null, available: false },
    });
    return { message: 'Logout realizado' };
  }

  async setAvailability(userId: string, available: boolean): Promise<{ available: boolean }> {
    const data: any = { available };
    if (!available) {
      data.latitude = null;
      data.longitude = null;
      data.locationupdatedat = null;
    }
    await this.prisma.user.update({ where: { id: userId }, data });
    return { available };
  }

  async updateLocation(userId: string, latitude: number, longitude: number): Promise<{ message: string }> {
    await this.prisma.user.update({
      where: { id: userId },
      data: { latitude, longitude, locationupdatedat: new Date() },
    });
    return { message: 'Localização atualizada' };
  }

  async forgotPassword(dto: ForgotPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantid: dto.tenantId ?? null },
      include: { tenant: true },
    });

    // Retorna mensagem genérica para não revelar se o e-mail existe
    if (!user) {
      return { message: 'Se este e-mail estiver cadastrado, você receberá um código em breve.' };
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresat = new Date(Date.now() + 15 * 60 * 1000); // 15 minutos

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordresetcode: code, passwordresetexpiresat: expiresat },
    });

    const appName = user.tenant?.appname ?? 'Distribuidora de Gás';

    this.mailService.sendPasswordReset(user.email, code, appName)
      .catch((err) => this.logger.error(`Falha ao enviar e-mail de reset: ${err.message}`));

    return { message: 'Se este e-mail estiver cadastrado, você receberá um código em breve.' };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: { email: dto.email, tenantid: dto.tenantId ?? null },
    });

    if (!user || !user.passwordresetcode) {
      throw new BadRequestException('Código inválido ou expirado.');
    }

    if (user.passwordresetcode !== dto.code) {
      throw new BadRequestException('Código inválido.');
    }

    if (user.passwordresetexpiresat && user.passwordresetexpiresat < new Date()) {
      throw new BadRequestException('Código expirado. Solicite um novo.');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordresetcode: null,
        passwordresetexpiresat: null,
      },
    });

    return { message: 'Senha redefinida com sucesso.' };
  }

  private generateToken(userId: string, email: string, role: string, tenantId: string | null): string {
    const payload = { sub: userId, email, role, tenantid: tenantId };
    return this.jwtService.sign(payload);
  }
}
