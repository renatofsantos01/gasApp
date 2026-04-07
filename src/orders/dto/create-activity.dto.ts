import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateActivityDto {
  @ApiProperty({ example: 'Estou na porta' })
  @IsString()
  @MinLength(1)
  content: string;
}
