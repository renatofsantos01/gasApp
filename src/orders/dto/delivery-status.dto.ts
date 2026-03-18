import { IsIn } from 'class-validator';

export class DeliveryStatusDto {
  @IsIn(['Saiu para Entrega', 'Entregue'])
  status: string;
}
