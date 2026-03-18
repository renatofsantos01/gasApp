import { IsString } from 'class-validator';

export class AssignDelivererDto {
  @IsString()
  delivererId: string;
}
