import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsInt, IsNumber, Min, IsIn } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';


export class OrderItemDto {
  @ApiProperty({ example: 'uuid-of-product' })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;
}

export class CreateOrderDto {
  @ApiProperty({ example: 'uuid-of-address' })
  @IsString()
  @IsNotEmpty()
  addressId: string;

  @ApiProperty({ example: 'Pix', enum: ['Dinheiro', 'Pix', 'Cartão'] })
  @IsIn(['Dinheiro', 'Pix', 'Cartão'])
  paymentMethod: string;

  @ApiPropertyOptional({ example: 'Deixar na portaria' })
  @IsString()
  @IsOptional()
  observations?: string;

  @ApiPropertyOptional({ example: 'DESCONTO10' })
  @IsString()
  @IsOptional()
  couponCode?: string;

  @ApiPropertyOptional({ example: '000.000.000-00' })
  @IsString()
  @IsOptional()
  cpfCnpj?: string;

  @ApiPropertyOptional({ example: 100.00, description: 'Troco para (apenas Dinheiro)' })
  @IsNumber()
  @Min(0)
  @IsOptional()
  changeFor?: number;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
