import { IsString, IsOptional, IsNumber, IsInt, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateProductDto {
  @ApiPropertyOptional({ example: 'Botijão P13' })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ example: 'Botijões' })
  @IsString()
  @IsOptional()
  category?: string;

  @ApiPropertyOptional({ example: 'Botijão de gás de 13kg' })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ example: 95.00 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ example: 'https://i.ytimg.com/vi/G5OahsOOiEc/maxresdefault.jpg' })
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @ApiPropertyOptional({ example: 50 })
  @IsInt()
  @Min(0)
  @IsOptional()
  stock?: number;
}
