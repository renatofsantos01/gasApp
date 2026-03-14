import { IsString, IsOptional, IsBoolean } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateAddressDto {
  @ApiPropertyOptional({ example: 'Rua das Flores' })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ example: '123' })
  @IsString()
  @IsOptional()
  number?: string;

  @ApiPropertyOptional({ example: 'Apto 45' })
  @IsString()
  @IsOptional()
  complement?: string;

  @ApiPropertyOptional({ example: 'Centro' })
  @IsString()
  @IsOptional()
  neighborhood?: string;

  @ApiPropertyOptional({ example: 'São Paulo' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ example: 'SP' })
  @IsString()
  @IsOptional()
  state?: string;

  @ApiPropertyOptional({ example: '01234-567' })
  @IsString()
  @IsOptional()
  zipcode?: string;

  @ApiPropertyOptional({ example: false })
  @IsBoolean()
  @IsOptional()
  isDefault?: boolean;
}
