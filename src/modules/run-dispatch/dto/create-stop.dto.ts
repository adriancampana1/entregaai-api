import { StatusParada } from '@prisma/client';
import { IsEnum, IsInt, IsNotEmpty } from 'class-validator';

export class CreateStopDto {
  @IsInt({ message: 'O ID da corrida deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'O ID da corrida não pode ser vazio.' })
  corridaId: number;

  @IsInt({ message: 'O ID do pedido deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'O ID do pedido não pode ser vazio.' })
  pedidoId: number;

  @IsInt({ message: 'A ordem deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'A ordem não pode ser vazia.' })
  ordem: number;

  @IsEnum(
    { enum: StatusParada },
    { message: 'O status da parada deve ser um valor válido.' },
  )
  @IsNotEmpty({ message: 'O status da parada não pode ser vazio.' })
  status: StatusParada;
}
