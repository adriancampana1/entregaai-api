import { Injectable } from '@nestjs/common';
import { Prisma, StatusPedido } from '@prisma/client';
import { PrismaService } from 'src/shared/infra/database/prisma.service';
import { Order, orderWithRelationsSelect } from '../interface/order';

@Injectable()
export class OrderRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    crmPedidoId: string,
    enderecoCompleto: string,
    nomeCliente: string,
    latitude: number,
    longitude: number,
    tempoMaximoEntrega: string,
    statusGeral: StatusPedido,
  ): Promise<Order> {
    const order = await this.prisma.pedido.create({
      data: {
        crmPedidoId,
        enderecoCompleto,
        latitude,
        nomeCliente,
        longitude,
        tempoMaximoEntrega,
        statusGeral,
      },
      select: orderWithRelationsSelect,
    });

    return order;
  }

  async findAll(): Promise<Order[]> {
    const { startDate, endDate } = this.getDateRangeForDailyOrders();

    const orders = await this.prisma.pedido.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lt: endDate,
        },
      },
      select: orderWithRelationsSelect,
    });

    return orders;
  }

  /**
   * Retorna o intervalo de datas para buscar pedidos do dia atual e do próximo até as 3h da manhã
   * Exemplo: Se hoje é 23/06, busca pedidos de 23/06 00:00 até 24/06 03:00
   */
  private getDateRangeForDailyOrders(): { startDate: Date; endDate: Date } {
    const now = new Date();

    const startDate = new Date();
    if (now.getHours() < 3) {
      startDate.setDate(now.getDate() - 1);
    }
    startDate.setHours(0, 0, 0, 0);

    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 1);
    endDate.setHours(3, 0, 0, 0);

    return { startDate, endDate };
  }

  async findById(id: number): Promise<Order | null> {
    const order = await this.prisma.pedido.findUnique({
      where: { id },
      select: orderWithRelationsSelect,
    });

    return order;
  }

  async findByCrmId(crmId: string): Promise<Order | null> {
    const order = await this.prisma.pedido.findUnique({
      where: { crmPedidoId: crmId },
      select: orderWithRelationsSelect,
    });

    return order;
  }

  async findOrdersById(ids: number[]): Promise<Order[]> {
    const orders = await this.prisma.pedido.findMany({
      where: {
        id: { in: ids },
      },
      select: orderWithRelationsSelect,
    });

    return orders;
  }

  async updateOrderStatuses(
    orderIds: number[],
    status: StatusPedido,
    tx: Prisma.TransactionClient,
  ) {
    return tx.pedido.updateMany({
      where: {
        id: { in: orderIds },
      },
      data: {
        statusGeral: status,
      },
    });
  }
}
