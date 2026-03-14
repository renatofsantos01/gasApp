import { IsString, IsNotEmpty, IsIn } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateOrderStatusDto {
  @ApiProperty({ 
    example: 'Em Preparo',
    enum: ['Pendente', 'Em Preparo', 'Saiu para Entrega', 'Entregue', 'Cancelado']
  })
  @IsString()
  @IsNotEmpty()
  @IsIn(['Pendente', 'Em Preparo', 'Saiu para Entrega', 'Entregue', 'Cancelado'])
  status: string;
}
