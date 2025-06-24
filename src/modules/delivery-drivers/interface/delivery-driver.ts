import { Prisma } from '@prisma/client';

export const deliveryDriverWithRelationsSelect = {
  id: true,
  nome: true,
  status: true,
  telefone: true,
  corridas: {
    select: {
      id: true,
      status: true,
      createdAt: true,
      updatedAt: true,
      paradas: {
        select: {
          id: true,
          status: true,
          corrida: {
            select: {
              id: true,
              status: true,
              entregadorId: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          corridaId: true,
          ordem: true,
          pedido: {
            select: {
              id: true,
              statusGeral: true,
              enderecoCompleto: true,
              nomeCliente: true,
              crmPedidoId: true,
              latitude: true,
              longitude: true,
              tempoMaximoEntrega: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          pedidoId: true,
          horarioConclusao: true,
          createdAt: true,
          updatedAt: true,
        },
      },
    },
  },
};

export type DeliveryDriver = Prisma.EntregadorGetPayload<{
  select: typeof deliveryDriverWithRelationsSelect;
}>;
