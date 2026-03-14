import { IsEmail, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ example: 'joao@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'senha123' })
  @IsString()
  password: string;

  @ApiPropertyOptional({ example: 'demo', description: 'Tenant ID (null for superadmin)' })
  @IsString()
  @IsOptional()
  tenantId?: string;
}
