import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderRepository } from '../repository/order.repository';
import { Order } from '../interface/order';
import { StatusPedido } from '@prisma/client';

@Injectable()
export class OrderService {
  constructor(private readonly orderRepository: OrderRepository) {}

  async createOrder(
    crmPedidoId: string,
    enderecoCompleto: string,
    nomeCliente: string,
    latitude: number,
    longitude: number,
    tempoMaximoEntrega: string,
    statusGeral: StatusPedido,
  ): Promise<Order> {
    const order = await this.orderRepository.create(
      crmPedidoId,
      enderecoCompleto,
      nomeCliente,
      latitude,
      longitude,
      tempoMaximoEntrega,
      statusGeral,
    );

    if (!order) {
      throw new BadRequestException('Falha ao salvar pedido');
    }

    return order;
  }

  async findAllOrders(): Promise<Order[]> {
    const orders = await this.orderRepository.findAll();

    return orders;
  }

  async findOrderById(id: string | number): Promise<Order | null> {
    const order = await this.orderRepository.findById(Number(id));

    if (!order) {
      throw new BadRequestException('Pedido não encontrado');
    }

    return order;
  }

  async findOrderByCrmId(crmId: string): Promise<Order | null> {
    if (!crmId) {
      throw new BadRequestException('ID do CRM não fornecido');
    }
    const order = await this.orderRepository.findByCrmId(crmId);

    return order;
  }

  async findOrdersByIds(ids: number[]): Promise<Order[]> {
    if (ids.length === 0) {
      throw new BadRequestException('Nenhum ID de pedido fornecido');
    }

    const orders = await this.orderRepository.findOrdersById(ids);

    if (orders.length === 0) {
      throw new BadRequestException(
        'Nenhum pedido encontrado para os IDs fornecidos',
      );
    }

    return orders;
  }
}
