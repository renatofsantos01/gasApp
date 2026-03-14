import { IsString, IsNotEmpty, IsNumber, IsInt, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({ example: 'Botijão P13' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Botijões', description: 'Botijões, Água, Acessórios, or Serviços' })
  @IsString()
  @IsNotEmpty()
  category: string;

  @ApiProperty({ example: 'Botijão de gás de 13kg' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 95.00 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiProperty({ example: 'https://i.ytimg.com/vi/xq9fAXa4jM0/sddefault.jpg' })
  @IsString()
  @IsNotEmpty()
  imageUrl: string;

  @ApiProperty({ example: 50 })
  @IsInt()
  @Min(0)
  stock: number;
}
