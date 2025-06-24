import { HttpService } from '@nestjs/axios';
import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ListOrdersResponse,
  OrderDetails,
  OrderDetailsResponse,
} from '../interface/order';
import { firstValueFrom } from 'rxjs';
import { OrderService } from 'src/modules/orders/service/order.service';
import { StatusPedido } from '@prisma/client';

@Injectable()
export class AnotaAiService {
  private readonly anotaAiUrl: string;
  private readonly anotaAiKey: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly orderService: OrderService,
  ) {
    this.anotaAiUrl = this.configService.get<string>('ANOTA_AI_URL') || '';
    this.anotaAiKey = this.configService.get<string>('ANOTA_AI_KEY') || '';

    if (!this.anotaAiUrl || !this.anotaAiKey) {
      throw new BadRequestException(
        'As variáveis de ambiente necessárias para Anota AI não estão configuradas corretamente.',
      );
    }
  }

  async fetchAllOrders(page: number): Promise<OrderDetails[]> {
    const headers = { Authorization: this.anotaAiKey };

    const response = await firstValueFrom(
      this.httpService.get<ListOrdersResponse>(
        `${this.anotaAiUrl}/ping/list?page=${page}`,
        { headers },
      ),
    );
    if (!response.data || !response.data.success || !response.data.info.docs) {
      console.warn(
        'Resposta inesperada da Anota AI ao buscar pedidos:',
        response.data,
      );
      throw new BadRequestException('Erro ao buscar pedidos na Anota AI.');
    }

    const orderDetailsPromises = response.data.info.docs.map((order) =>
      this.fetchOrderDetails(order._id),
    );

    const fetchedOrders = await Promise.all(orderDetailsPromises);

    for (const order of fetchedOrders) {
      if (order.check === 1 || order.check === 2) {
        const existingOrder = await this.orderService.findOrderByCrmId(
          order._id,
        );

        if (!existingOrder && order.type === 'DELIVERY') {
          await this.orderService.createOrder(
            order._id,
            order.deliveryAddress.formattedAddress,
            order.customer.name,
            order.deliveryAddress.coordinates.latitude,
            order.deliveryAddress.coordinates.longitude,
            order.time_max,
            StatusPedido.AGUARDANDO_ROTA,
          );
        }
      }
    }

    return fetchedOrders;
  }

  async fetchOrderDetails(orderId: string): Promise<OrderDetails> {
    const headers = { Authorization: this.anotaAiKey };

    const response = await firstValueFrom(
      this.httpService.get<OrderDetailsResponse>(
        `${this.anotaAiUrl}/ping/get/${orderId}`,
        { headers },
      ),
    );

    if (!response.data || !response.data.success) {
      console.warn(
        'Resposta inesperada da Anota AI ao buscar detalhes do pedido:',
        response.data,
      );
      throw new BadRequestException('Erro ao buscar detalhes do pedido.');
    }

    return response.data.info;
  }
}
