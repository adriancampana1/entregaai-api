import { ArrayMinSize, IsArray, IsInt, IsNotEmpty } from 'class-validator';

export class CreateRunDispatchDto {
  @IsArray({ message: 'Lista de pedidos é obrigatória' })
  @ArrayMinSize(1, { message: 'É necessário informar pelo menos um pedido' })
  @IsInt({ each: true, message: 'Todos os pedidos devem ser números inteiros' })
  @IsNotEmpty({ message: 'Lista de pedidos não pode estar vazia' })
  orderIds: number[];

  @IsInt({ message: 'ID do entregador deve ser um número inteiro' })
  @IsNotEmpty({ message: 'ID do entregador é obrigatório' })
  deliveryDriverId: number;
}
