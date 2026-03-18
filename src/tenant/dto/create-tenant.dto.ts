import { IsString, IsNotEmpty, IsEmail, IsOptional, IsBoolean, Matches } from 'class-validator';

export class CreateTenantDto {
  @IsString()
  @IsNotEmpty()
  companyname: string;

  @IsString()
  @IsNotEmpty()
  appname: string;

  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9-]+$/, { message: 'subdomain must contain only lowercase letters, numbers and hyphens' })
  subdomain: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'primarycolor must be a valid hex color' })
  primarycolor?: string;

  @IsOptional()
  @IsString()
  @Matches(/^#[0-9A-Fa-f]{6}$/, { message: 'secondarycolor must be a valid hex color' })
  secondarycolor?: string;

  @IsOptional()
  @IsString()
  logourl?: string;

  @IsOptional()
  @IsString()
  splashscreenurl?: string;

  @IsOptional()
  @IsBoolean()
  isactive?: boolean;
}
