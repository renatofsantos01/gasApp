import { IsString, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CancelOrderDto {
  @ApiProperty({ example: 'Cliente solicitou cancelamento' })
  @IsString()
  @IsNotEmpty()
  cancelReason: string;
}
