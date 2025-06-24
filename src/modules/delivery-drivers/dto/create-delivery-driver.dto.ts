import { IsNotEmpty, IsString } from 'class-validator';

export class CreateDeliveryDriverDto {
  @IsNotEmpty({ message: 'Nome do entregador é obrigatório.' })
  @IsString({ message: 'Nome do entregador deve ser uma string.' })
  nome: string;

  @IsNotEmpty({ message: 'Telefone do entregador é obrigatório.' })
  @IsString({ message: 'Telefone do entregador deve ser uma string.' })
  telefone: string;
}
