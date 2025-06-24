import { IsInt, IsNotEmpty } from 'class-validator';

export class CompleteStopDto {
  @IsInt({ message: 'O ID do entregador deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'O ID do entregador não pode ser vazio.' })
  deliveryDriverId: number;

  @IsInt({ message: 'O ID da corrida deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'O ID da corrida não pode ser vazio.' })
  runId: number;

  @IsInt({ message: 'O ID da parada deve ser um número inteiro.' })
  @IsNotEmpty({ message: 'O ID da parada não pode ser vazio.' })
  stopId: number;
}
