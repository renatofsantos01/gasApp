import { IsString, IsNotEmpty, IsOptional, IsArray, ValidateNested, IsInt, Min, IsIn } from 'class-validator';
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

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];
}
